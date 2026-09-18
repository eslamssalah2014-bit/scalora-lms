import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';

export interface SaveAssetOptions {
  buffer?: Buffer;
  base64?: string;
  fileName?: string;
  mimeType?: string;
  folder?: string;
  protocol?: string;
  host?: string;
}

export interface SavedAssetResult {
  id: string;
  fileName: string;
  mimeType: string;
  folder: string;
  size: number;
  sizeFormatted: string;
  path: string;
  url: string;
  relativeUrl: string;
}

export class AssetStorageService {
  private static uploadsBaseDir = path.join(process.cwd(), 'uploads');

  /**
   * Ensure target directory exists on disk
   */
  private static ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Save asset to both local disk cache and persistent PostgreSQL database
   */
  public static async saveAsset(options: SaveAssetOptions): Promise<SavedAssetResult> {
    const { folder = 'general', protocol = 'https', host = 'scalora-lms.onrender.com' } = options;

    let buffer: Buffer;
    let mimeType = options.mimeType || 'image/jpeg';
    let ext = 'jpg';

    if (options.base64) {
      const rawBase64 = options.base64;
      const mimeMatch = rawBase64.match(/^data:([A-Za-z-+\/0-9.]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1].toLowerCase();
      }
      const base64Clean = rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64;
      buffer = Buffer.from(base64Clean, 'base64');
    } else if (options.buffer) {
      buffer = options.buffer;
    } else {
      throw new Error('No asset data provided to saveAsset.');
    }

    // Determine extension
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('svg')) ext = 'svg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('mp4')) ext = 'mp4';
    else ext = 'jpg';

    // Generate clean, deterministic filename if not provided
    let safeFileName = options.fileName;
    if (!safeFileName || safeFileName.trim().length === 0) {
      safeFileName = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    } else {
      // Strip unsafe chars but keep extension
      const parsed = path.parse(safeFileName);
      const cleanBase = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      safeFileName = `${cleanBase}_${Date.now()}.${ext}`;
    }

    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const folderDir = path.join(this.uploadsBaseDir, cleanFolder);
    this.ensureDir(folderDir);

    const filePath = path.join(folderDir, safeFileName);

    // 1. Write to local disk cache
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (diskErr) {
      console.warn('[AssetStorage] Local disk write error (continuing with DB persistence):', diskErr);
    }

    // 2. Persist to PostgreSQL database (survives container restarts)
    const base64Data = buffer.toString('base64');
    const assetRecord = await prisma.storedAsset.upsert({
      where: { fileName: safeFileName },
      create: {
        fileName: safeFileName,
        mimeType,
        size: buffer.length,
        folder: cleanFolder,
        dataBase64: base64Data,
      },
      update: {
        mimeType,
        size: buffer.length,
        folder: cleanFolder,
        dataBase64: base64Data,
      },
    });

    const sizeFormatted =
      buffer.length > 1024 * 1024
        ? `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(buffer.length / 1024)} KB`;

    const publicPath = `/uploads/${cleanFolder}/${safeFileName}`;
    const relativeUrl = `/api/uploads/${cleanFolder}/${safeFileName}`;
    const cleanHost = host.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const fullUrl = `${protocol}://${cleanHost}${relativeUrl}`;

    return {
      id: assetRecord.id,
      fileName: safeFileName,
      mimeType,
      folder: cleanFolder,
      size: buffer.length,
      sizeFormatted,
      path: publicPath,
      url: fullUrl,
      relativeUrl,
    };
  }

  /**
   * Retrieve asset by fileName: checks disk cache first, falls back to PostgreSQL, recaching to disk
   */
  public static async getAsset(
    folder: string,
    fileName: string
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFileName = path.basename(fileName);

    // 1. Check disk cache
    const targetPath = path.join(this.uploadsBaseDir, cleanFolder, cleanFileName);
    if (fs.existsSync(targetPath)) {
      try {
        const buffer = fs.readFileSync(targetPath);
        const mimeType = this.detectMimeType(cleanFileName);
        return { buffer, mimeType };
      } catch (err) {
        console.warn(`[AssetStorage] Error reading disk file ${targetPath}:`, err);
      }
    }

    // Also check root uploads without folder
    const fallbackPath = path.join(this.uploadsBaseDir, cleanFileName);
    if (fs.existsSync(fallbackPath)) {
      try {
        const buffer = fs.readFileSync(fallbackPath);
        const mimeType = this.detectMimeType(cleanFileName);
        return { buffer, mimeType };
      } catch (err) {
        console.warn(`[AssetStorage] Error reading fallback disk file:`, err);
      }
    }

    // 2. Fallback to PostgreSQL database
    try {
      const asset = await prisma.storedAsset.findFirst({
        where: {
          fileName: cleanFileName,
        },
      });

      if (asset && asset.dataBase64) {
        const buffer = Buffer.from(asset.dataBase64, 'base64');
        // Lazy recache to disk so subsequent requests don't hit DB
        try {
          this.ensureDir(path.dirname(targetPath));
          fs.writeFileSync(targetPath, buffer);
        } catch (cacheErr) {
          console.warn('[AssetStorage] Lazy disk recache failed:', cacheErr);
        }
        return { buffer, mimeType: asset.mimeType || this.detectMimeType(cleanFileName) };
      }
    } catch (dbErr) {
      console.error('[AssetStorage] Database retrieval error for asset:', cleanFileName, dbErr);
    }

    return null;
  }

  /**
   * Detect MIME type from extension
   */
  public static detectMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'mp4':
        return 'video/mp4';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Fallback SVG placeholder when asset is not found
   */
  public static getPlaceholderSvg(category = 'course', title = 'Scalora LMS'): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="540" cy="550" r="180" fill="url(#accent)" opacity="0.12"/>
  <g transform="translate(460, 470)" fill="none" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
    <path d="M6 6h10"/>
    <path d="M6 10h10"/>
  </g>
  <text x="540" y="780" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="700" fill="#F8FAFC" text-anchor="middle">${title.replace(/[<>&"]/g, '')}</text>
  <text x="540" y="840" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#38BDF8" text-anchor="middle" letter-spacing="4">SCALORA ACADEMY</text>
</svg>`;
  }
}

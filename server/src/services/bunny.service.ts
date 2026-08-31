import crypto from 'crypto';

/**
 * Bunny Stream Service for Scalora LMS
 * 
 * Architectural Capabilities:
 * - Dynamic embed URL building (https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID})
 * - Auto extraction of Video ID from raw UUID, Play URL, or Embed URL
 * - Token Security Architecture ready (SHA256 signature generation when token security key is provided)
 * - Domain restriction readiness for scaloraa.online & www.scaloraa.online
 */

export interface BunnyEmbedOptions {
  libraryId?: string | number;
  videoId: string;
  autoPlay?: boolean;
  preload?: boolean;
  responsive?: boolean;
  expiresInSeconds?: number;
}

export class BunnyService {
  private defaultLibraryId: string;
  private tokenSecurityKey?: string;
  private allowedDomains: string[];

  constructor() {
    this.defaultLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID || '384144';
    this.tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_KEY || process.env.BUNNY_TOKEN_AUTH_KEY;
    this.allowedDomains = ['scaloraa.online', 'www.scaloraa.online', 'localhost'];
  }

  /**
   * Extracts a clean Bunny Video ID (UUID format) from:
   * - Raw UUID: "e6f4d9c1-8451-419b-a01c-3be08761ba10"
   * - Embed URL: "https://iframe.mediadelivery.net/embed/384144/e6f4d9c1-8451-419b-a01c-3be08761ba10"
   * - Play URL: "https://iframe.mediadelivery.net/play/384144/e6f4d9c1-8451-419b-a01c-3be08761ba10"
   * - Direct URL or query format
   */
  public extractVideoId(input?: string | null): string | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. Direct standard UUID check (36 chars: 8-4-4-4-12)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidRegex.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    // 2. Mediadeliver / Bunny iframe embed/play URL pattern:
    // https://iframe.mediadelivery.net/(embed|play)/{libraryId}/{videoId}
    const urlPattern = /(?:iframe\.mediadelivery\.net|video\.bunnycdn\.com)\/(?:embed|play)\/(?:\d+)\/([0-9a-fA-F-]{36})/i;
    const urlMatch = trimmed.match(urlPattern);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toLowerCase();
    }

    // 3. Fallback UUID search anywhere in string
    const fallbackMatch = trimmed.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].toLowerCase();
    }

    // 4. If non-standard string ID provided (e.g. legacy or custom ID)
    if (/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  /**
   * Extracts Library ID from a full Bunny URL if present.
   */
  public extractLibraryId(input?: string | null): string | null {
    if (!input || typeof input !== 'string') return null;
    const match = input.match(/(?:iframe\.mediadelivery\.net|video\.bunnycdn\.com)\/(?:embed|play)\/(\d+)\//i);
    return match && match[1] ? match[1] : null;
  }

  /**
   * Architecture ready: Generates SHA256 Bunny Token Signature for secure URL authentication
   * Format: SHA256(securityToken + videoId + expirationTime)
   */
  public generateTokenSignature(videoId: string, expirationTime: number): string | null {
    if (!this.tokenSecurityKey) {
      return null; // Token auth not configured yet
    }

    const dataToSign = `${this.tokenSecurityKey}${videoId}${expirationTime}`;
    return crypto.createHash('sha256').update(dataToSign).digest('hex');
  }

  /**
   * Builds the dynamic Bunny Stream iframe embed URL.
   * Does NOT store this URL in the database; calculated on-demand at runtime.
   */
  public buildEmbedUrl(options: BunnyEmbedOptions): string {
    const rawVideoId = options.videoId;
    const cleanVideoId = this.extractVideoId(rawVideoId) || rawVideoId;
    const libraryId = options.libraryId || this.extractLibraryId(rawVideoId) || this.defaultLibraryId;

    const queryParams = new URLSearchParams();
    if (options.autoPlay) queryParams.set('autoplay', 'true');
    if (options.preload) queryParams.set('preload', 'true');
    if (options.responsive !== false) queryParams.set('responsive', 'true');

    // Token authentication signature (if token key is enabled in future)
    if (this.tokenSecurityKey) {
      const expiresIn = options.expiresInSeconds || 3600 * 4; // 4 hours default
      const expires = Math.floor(Date.now() / 1000) + expiresIn;
      const token = this.generateTokenSignature(cleanVideoId, expires);
      if (token) {
        queryParams.set('token', token);
        queryParams.set('expires', expires.toString());
      }
    }

    const queryStr = queryParams.toString();
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${cleanVideoId}${queryStr ? `?${queryStr}` : ''}`;
  }

  public getAllowedDomains(): string[] {
    return [...this.allowedDomains];
  }
}

export const bunnyService = new BunnyService();

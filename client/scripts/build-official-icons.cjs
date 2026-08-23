const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Calculation
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

// Decode standard PNG to RGBA Buffer
function decodePng(buffer) {
  let offset = 8;
  let width, height;
  let idatBuffers = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressedData = Buffer.concat(idatBuffers);
  const uncompressed = zlib.inflateSync(compressedData);

  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);

  let srcOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = uncompressed[srcOffset++];
    const prevRowOffset = (y - 1) * stride;
    const currRowOffset = y * stride;

    for (let x = 0; x < stride; x++) {
      const rawByte = uncompressed[srcOffset++];
      const left = x >= bpp ? pixels[currRowOffset + x - bpp] : 0;
      const above = y > 0 ? pixels[prevRowOffset + x] : 0;
      const upperLeft = (y > 0 && x >= bpp) ? pixels[prevRowOffset + x - bpp] : 0;

      let val = rawByte;
      if (filterType === 1) {
        val = (rawByte + left) & 0xFF;
      } else if (filterType === 2) {
        val = (rawByte + above) & 0xFF;
      } else if (filterType === 3) {
        val = (rawByte + Math.floor((left + above) / 2)) & 0xFF;
      } else if (filterType === 4) {
        const p = left + above - upperLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - above);
        const pc = Math.abs(p - upperLeft);
        let pr;
        if (pa <= pb && pa <= pc) pr = left;
        else if (pb <= pc) pr = above;
        else pr = upperLeft;
        val = (rawByte + pr) & 0xFF;
      }
      pixels[currRowOffset + x] = val;
    }
  }

  return { width, height, pixels };
}

// Encode RGBA Buffer to PNG
function encodePng(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(height * rowLen);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * rowLen;
    raw[rawOffset] = 0; // Filter 0 (None)
    const srcOffset = y * width * 4;
    pixels.copy(raw, rawOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

// Resample and Center Image onto Square Target Canvas
function renderSquareIcon(source, targetSize, paddingRatio = 0.12) {
  const targetWidth = targetSize;
  const targetHeight = targetSize;
  const outPixels = Buffer.alloc(targetWidth * targetHeight * 4);

  // Background: Dark Navy #04152D (rgba: 4, 21, 45, 255)
  for (let i = 0; i < outPixels.length; i += 4) {
    outPixels[i] = 4;
    outPixels[i + 1] = 21;
    outPixels[i + 2] = 45;
    outPixels[i + 3] = 255;
  }

  // Calculate draw dimensions for source image maintaining aspect ratio
  const availableW = targetWidth * (1 - paddingRatio * 2);
  const availableH = targetHeight * (1 - paddingRatio * 2);

  const scale = Math.min(availableW / source.width, availableH / source.height);
  const drawW = Math.round(source.width * scale);
  const drawH = Math.round(source.height * scale);

  const startX = Math.round((targetWidth - drawW) / 2);
  const startY = Math.round((targetHeight - drawH) / 2);

  // Bilinear/Nearest Resampling
  for (let y = 0; y < drawH; y++) {
    const srcY = Math.min(source.height - 1, Math.floor(y / scale));
    const targetY = startY + y;
    if (targetY < 0 || targetY >= targetHeight) continue;

    for (let x = 0; x < drawW; x++) {
      const srcX = Math.min(source.width - 1, Math.floor(x / scale));
      const targetX = startX + x;
      if (targetX < 0 || targetX >= targetWidth) continue;

      const srcIdx = (srcY * source.width + srcX) * 4;
      const targetIdx = (targetY * targetWidth + targetX) * 4;

      const sr = source.pixels[srcIdx];
      const sg = source.pixels[srcIdx + 1];
      const sb = source.pixels[srcIdx + 2];
      const sa = source.pixels[srcIdx + 3] / 255;

      // Alpha Blend over background
      const br = 4, bg = 21, bb = 45;
      outPixels[targetIdx] = Math.round(sr * sa + br * (1 - sa));
      outPixels[targetIdx + 1] = Math.round(sg * sa + bg * (1 - sa));
      outPixels[targetIdx + 2] = Math.round(sb * sa + bb * (1 - sa));
      outPixels[targetIdx + 3] = 255;
    }
  }

  return encodePng(targetWidth, targetHeight, outPixels);
}

// Crop Top Origami 'S' Emblem Icon
function renderEmblemSquareIcon(source, targetSize) {
  const targetWidth = targetSize;
  const targetHeight = targetSize;
  const outPixels = Buffer.alloc(targetWidth * targetHeight * 4);

  for (let i = 0; i < outPixels.length; i += 4) {
    outPixels[i] = 4;
    outPixels[i + 1] = 21;
    outPixels[i + 2] = 45;
    outPixels[i + 3] = 255;
  }

  // Crop Region for the 3D 'S' ribbon mark: top 68% of image, centered horizontally
  const cropX1 = Math.floor(source.width * 0.28);
  const cropX2 = Math.floor(source.width * 0.72);
  const cropY1 = Math.floor(source.height * 0.05);
  const cropY2 = Math.floor(source.height * 0.72);

  const cropW = cropX2 - cropX1;
  const cropH = cropY2 - cropY1;

  const paddingRatio = 0.14;
  const availableW = targetWidth * (1 - paddingRatio * 2);
  const availableH = targetHeight * (1 - paddingRatio * 2);

  const scale = Math.min(availableW / cropW, availableH / cropH);
  const drawW = Math.round(cropW * scale);
  const drawH = Math.round(cropH * scale);

  const startX = Math.round((targetWidth - drawW) / 2);
  const startY = Math.round((targetHeight - drawH) / 2);

  for (let y = 0; y < drawH; y++) {
    const srcY = Math.min(source.height - 1, cropY1 + Math.floor(y / scale));
    const targetY = startY + y;
    if (targetY < 0 || targetY >= targetHeight) continue;

    for (let x = 0; x < drawW; x++) {
      const srcX = Math.min(source.width - 1, cropX1 + Math.floor(x / scale));
      const targetX = startX + x;
      if (targetX < 0 || targetX >= targetWidth) continue;

      const srcIdx = (srcY * source.width + srcX) * 4;
      const targetIdx = (targetY * targetWidth + targetX) * 4;

      const sr = source.pixels[srcIdx];
      const sg = source.pixels[srcIdx + 1];
      const sb = source.pixels[srcIdx + 2];
      const sa = source.pixels[srcIdx + 3] / 255;

      const br = 4, bg = 21, bb = 45;
      outPixels[targetIdx] = Math.round(sr * sa + br * (1 - sa));
      outPixels[targetIdx + 1] = Math.round(sg * sa + bg * (1 - sa));
      outPixels[targetIdx + 2] = Math.round(sb * sa + bb * (1 - sa));
      outPixels[targetIdx + 3] = 255;
    }
  }

  return encodePng(targetWidth, targetHeight, outPixels);
}

// Load official source logo uploaded by user
const sourceLogoPath = 'C:\\Users\\eslam salah Hosny\\.gemini\\antigravity-ide\\brain\\f161b989-bf48-4179-bca6-b790f0c77b95\\.user_uploaded\\media_1787494102516.png';
const decodedLogo = decodePng(fs.readFileSync(sourceLogoPath));

console.log('Generating official Scalora PWA icons...');

// 1. 512x512 Main PWA Splash & Launcher
fs.writeFileSync('public/pwa-512x512.png', renderSquareIcon(decodedLogo, 512, 0.08));

// 2. 192x192 Main PWA Android Icon
fs.writeFileSync('public/pwa-192x192.png', renderSquareIcon(decodedLogo, 192, 0.08));

// 3. 512x512 Maskable Icon with Safe Area Padding
fs.writeFileSync('public/pwa-512x512-maskable.png', renderSquareIcon(decodedLogo, 512, 0.16));

// 4. Apple Touch Icon 180x180
fs.writeFileSync('public/apple-touch-icon.png', renderSquareIcon(decodedLogo, 180, 0.08));

// 5. Scalora Icon (Emblem for in-app UI headers)
fs.writeFileSync('public/scalora-icon-transparent.png', renderEmblemSquareIcon(decodedLogo, 256));

console.log('✅ All official Scalora PWA icons generated and replaced successfully!');

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pngjs_1 = require("pngjs");
function findTightBoundingBox(src) {
    let minX = src.width;
    let maxX = 0;
    let minY = src.height;
    let maxY = 0;
    for (let y = 0; y < src.height; y++) {
        for (let x = 0; x < src.width; x++) {
            const a = src.data[(y * src.width + x) * 4 + 3];
            if (a > 15) {
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
        }
    }
    return { minX, minY, maxX, maxY };
}
function renderPaddedIcon(src, bbox, targetSize, paddingRatio, backgroundColor) {
    const dst = new pngjs_1.PNG({ width: targetSize, height: targetSize });
    // Initialize canvas
    for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
            const idx = (targetSize * y + x) << 2;
            if (backgroundColor) {
                dst.data[idx] = backgroundColor.r;
                dst.data[idx + 1] = backgroundColor.g;
                dst.data[idx + 2] = backgroundColor.b;
                dst.data[idx + 3] = 255;
            }
            else {
                dst.data[idx] = 0;
                dst.data[idx + 1] = 0;
                dst.data[idx + 2] = 0;
                dst.data[idx + 3] = 0;
            }
        }
    }
    const emblemW = bbox.maxX - bbox.minX + 1;
    const emblemH = bbox.maxY - bbox.minY + 1;
    const maxEmblemDim = targetSize * paddingRatio;
    const scale = Math.min(maxEmblemDim / emblemW, maxEmblemDim / emblemH);
    const scaledW = Math.max(1, Math.round(emblemW * scale));
    const scaledH = Math.max(1, Math.round(emblemH * scale));
    const offsetX = Math.floor((targetSize - scaledW) / 2);
    const offsetY = Math.floor((targetSize - scaledH) / 2);
    for (let dy = 0; dy < scaledH; dy++) {
        for (let dx = 0; dx < scaledW; dx++) {
            const srcX = bbox.minX + (dx / scaledW) * (emblemW - 1);
            const srcY = bbox.minY + (dy / scaledH) * (emblemH - 1);
            const srcXi = Math.floor(srcX);
            const srcYi = Math.floor(srcY);
            const cpx = srcX - srcXi;
            const cpy = srcY - srcYi;
            const idx00 = (src.width * srcYi + srcXi) << 2;
            const idx10 = (src.width * srcYi + Math.min(srcXi + 1, src.width - 1)) << 2;
            const idx01 = (src.width * Math.min(srcYi + 1, src.height - 1) + srcXi) << 2;
            const idx11 = (src.width * Math.min(srcYi + 1, src.height - 1) + Math.min(srcXi + 1, src.width - 1)) << 2;
            const topA = src.data[idx00 + 3] * (1 - cpx) + src.data[idx10 + 3] * cpx;
            const botA = src.data[idx01 + 3] * (1 - cpx) + src.data[idx11 + 3] * cpx;
            const alpha = Math.round(topA * (1 - cpy) + botA * cpy);
            if (alpha > 5) {
                const topR = src.data[idx00] * (1 - cpx) + src.data[idx10] * cpx;
                const botR = src.data[idx01] * (1 - cpx) + src.data[idx11] * cpx;
                const topG = src.data[idx00 + 1] * (1 - cpx) + src.data[idx10 + 1] * cpx;
                const botG = src.data[idx01 + 1] * (1 - cpx) + src.data[idx11 + 1] * cpx;
                const topB = src.data[idx00 + 2] * (1 - cpx) + src.data[idx10 + 2] * cpx;
                const botB = src.data[idx01 + 2] * (1 - cpx) + src.data[idx11 + 2] * cpx;
                const r = Math.round(topR * (1 - cpy) + botR * cpy);
                const g = Math.round(topG * (1 - cpy) + botG * cpy);
                const b = Math.round(topB * (1 - cpy) + botB * cpy);
                const dstX = offsetX + dx;
                const dstY = offsetY + dy;
                if (dstX >= 0 && dstX < targetSize && dstY >= 0 && dstY < targetSize) {
                    const dstIdx = (targetSize * dstY + dstX) << 2;
                    if (backgroundColor) {
                        // Alpha composite over background color #04152D (RGB 4, 21, 45)
                        const aNorm = alpha / 255;
                        dst.data[dstIdx] = Math.round(r * aNorm + backgroundColor.r * (1 - aNorm));
                        dst.data[dstIdx + 1] = Math.round(g * aNorm + backgroundColor.g * (1 - aNorm));
                        dst.data[dstIdx + 2] = Math.round(b * aNorm + backgroundColor.b * (1 - aNorm));
                        dst.data[dstIdx + 3] = 255;
                    }
                    else {
                        dst.data[dstIdx] = r;
                        dst.data[dstIdx + 1] = g;
                        dst.data[dstIdx + 2] = b;
                        dst.data[dstIdx + 3] = alpha;
                    }
                }
            }
        }
    }
    return dst;
}
async function generateAllPwaAssets() {
    const publicDir = path_1.default.resolve(process.cwd(), '../client/public');
    const iconsDir = path_1.default.join(publicDir, 'icons');
    if (!fs_1.default.existsSync(iconsDir)) {
        fs_1.default.mkdirSync(iconsDir, { recursive: true });
    }
    const logoTransparentPath = path_1.default.join(publicDir, 'scalora-logo-transparent.png');
    console.log('Reading source logo:', logoTransparentPath);
    const fileData = fs_1.default.readFileSync(logoTransparentPath);
    const src = pngjs_1.PNG.sync.read(fileData);
    const bbox = findTightBoundingBox(src);
    console.log(`Extracted emblem bounding box: (${bbox.minX}, ${bbox.minY}) to (${bbox.maxX}, ${bbox.maxY})`);
    const scaloraDarkBg = { r: 4, g: 21, b: 45 }; // Exact #04152D matching app background
    // 1. pwa-192x192.png (100% Transparent PNG for Android Splash & App Launcher)
    const pwa192 = renderPaddedIcon(src, bbox, 192, 0.82);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'pwa-192x192.png'), pngjs_1.PNG.sync.write(pwa192));
    console.log('✓ Generated pwa-192x192.png (Transparent)');
    // 2. pwa-512x512.png (100% Transparent PNG for High-DPI Splash & Launcher)
    const pwa512 = renderPaddedIcon(src, bbox, 512, 0.82);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'pwa-512x512.png'), pngjs_1.PNG.sync.write(pwa512));
    console.log('✓ Generated pwa-512x512.png (Transparent)');
    // 3. pwa-512x512-maskable.png (Maskable icon with safe zone on exact #04152D)
    const pwaMaskable = renderPaddedIcon(src, bbox, 512, 0.65, scaloraDarkBg);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'pwa-512x512-maskable.png'), pngjs_1.PNG.sync.write(pwaMaskable));
    console.log('✓ Generated pwa-512x512-maskable.png (Safe-Zone #04152D)');
    // 4. apple-touch-icon.png (180x180 on exact #04152D)
    const appleTouch = renderPaddedIcon(src, bbox, 180, 0.72, scaloraDarkBg);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'apple-touch-icon.png'), pngjs_1.PNG.sync.write(appleTouch));
    console.log('✓ Generated apple-touch-icon.png (iOS Home Screen)');
    // 5. scalora-icon-transparent.png (100% Transparent)
    const scaloraIconTrans = renderPaddedIcon(src, bbox, 512, 0.85);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'scalora-icon-transparent.png'), pngjs_1.PNG.sync.write(scaloraIconTrans));
    console.log('✓ Generated scalora-icon-transparent.png (Transparent)');
    // 6. scalora-logo.png & logo.png (100% Transparent)
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'scalora-logo.png'), pngjs_1.PNG.sync.write(pwa512));
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'logo.png'), pngjs_1.PNG.sync.write(pwa512));
    console.log('✓ Updated scalora-logo.png and logo.png to transparent emblem');
    // 7. notification-icon-192.png & notification-icon-96.png (100% Transparent)
    const notif192 = renderPaddedIcon(src, bbox, 192, 0.82);
    const notif96 = renderPaddedIcon(src, bbox, 96, 0.82);
    fs_1.default.writeFileSync(path_1.default.join(iconsDir, 'notification-icon-192.png'), pngjs_1.PNG.sync.write(notif192));
    fs_1.default.writeFileSync(path_1.default.join(iconsDir, 'notification-icon-96.png'), pngjs_1.PNG.sync.write(notif96));
    console.log('✓ Generated icons/notification-icon-192.png and notification-icon-96.png');
    // 8. badge-icon.png (Monochrome pure white silhouette on 100% transparent background)
    const badgePng = new pngjs_1.PNG({ width: 96, height: 96 });
    const rawBadge = renderPaddedIcon(src, bbox, 96, 0.75);
    for (let i = 0; i < rawBadge.data.length; i += 4) {
        const a = rawBadge.data[i + 3];
        if (a > 15) {
            badgePng.data[i] = 255;
            badgePng.data[i + 1] = 255;
            badgePng.data[i + 2] = 255;
            badgePng.data[i + 3] = a;
        }
        else {
            badgePng.data[i] = 0;
            badgePng.data[i + 1] = 0;
            badgePng.data[i + 2] = 0;
            badgePng.data[i + 3] = 0;
        }
    }
    fs_1.default.writeFileSync(path_1.default.join(iconsDir, 'badge-icon.png'), pngjs_1.PNG.sync.write(badgePng));
    console.log('✓ Generated icons/badge-icon.png (Monochrome White Silhouette)');
    console.log('\n✨ All PWA Splash and App Icon assets generated successfully!');
}
generateAllPwaAssets();

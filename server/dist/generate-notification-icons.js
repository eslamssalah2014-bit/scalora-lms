"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pngjs_1 = require("pngjs");
function resizeBilinear(src, targetWidth, targetHeight) {
    const dst = new pngjs_1.PNG({ width: targetWidth, height: targetHeight });
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const gx = (x / targetWidth) * (src.width - 1);
            const gy = (y / targetHeight) * (src.height - 1);
            const gxi = Math.floor(gx);
            const gyi = Math.floor(gy);
            const cpx = gx - gxi;
            const cpy = gy - gyi;
            const idx00 = (src.width * gyi + gxi) << 2;
            const idx10 = (src.width * gyi + Math.min(gxi + 1, src.width - 1)) << 2;
            const idx01 = (src.width * Math.min(gyi + 1, src.height - 1) + gxi) << 2;
            const idx11 = (src.width * Math.min(gyi + 1, src.height - 1) + Math.min(gxi + 1, src.width - 1)) << 2;
            const dstIdx = (targetWidth * y + x) << 2;
            for (let c = 0; c < 4; c++) {
                const top = src.data[idx00 + c] * (1 - cpx) + src.data[idx10 + c] * cpx;
                const bottom = src.data[idx01 + c] * (1 - cpx) + src.data[idx11 + c] * cpx;
                dst.data[dstIdx + c] = Math.round(top * (1 - cpy) + bottom * cpy);
            }
        }
    }
    return dst;
}
function createMonochromeBadge(src, targetWidth, targetHeight) {
    const resized = resizeBilinear(src, targetWidth, targetHeight);
    const badge = new pngjs_1.PNG({ width: targetWidth, height: targetHeight });
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const idx = (targetWidth * y + x) << 2;
            const r = resized.data[idx];
            const g = resized.data[idx + 1];
            const b = resized.data[idx + 2];
            const a = resized.data[idx + 3];
            // If pixel is visible, make it pure white with preserved alpha (for Android status bar mask)
            if (a > 20) {
                // Brightness
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                const effectiveAlpha = Math.min(255, Math.round((a * (luminance > 30 ? 1 : 0.5))));
                badge.data[idx] = 255; // R = 255
                badge.data[idx + 1] = 255; // G = 255
                badge.data[idx + 2] = 255; // B = 255
                badge.data[idx + 3] = a; // Alpha channel preserved
            }
            else {
                badge.data[idx] = 0;
                badge.data[idx + 1] = 0;
                badge.data[idx + 2] = 0;
                badge.data[idx + 3] = 0;
            }
        }
    }
    return badge;
}
async function generateNotificationIcons() {
    const publicDir = path_1.default.resolve(process.cwd(), '../client/public');
    const iconsDir = path_1.default.join(publicDir, 'icons');
    if (!fs_1.default.existsSync(iconsDir)) {
        fs_1.default.mkdirSync(iconsDir, { recursive: true });
    }
    const sourceIconPath = path_1.default.join(publicDir, 'scalora-icon-transparent.png');
    console.log('Reading source icon:', sourceIconPath);
    const fileData = fs_1.default.readFileSync(sourceIconPath);
    const srcPng = pngjs_1.PNG.sync.read(fileData);
    console.log(`Source PNG dimensions: ${srcPng.width}x${srcPng.height}`);
    // 1. Generate notification-icon-96.png
    const icon96 = resizeBilinear(srcPng, 96, 96);
    const out96Path = path_1.default.join(iconsDir, 'notification-icon-96.png');
    fs_1.default.writeFileSync(out96Path, pngjs_1.PNG.sync.write(icon96));
    console.log('✓ Generated:', out96Path);
    // 2. Generate notification-icon-192.png
    const icon192 = resizeBilinear(srcPng, 192, 192);
    const out192Path = path_1.default.join(iconsDir, 'notification-icon-192.png');
    fs_1.default.writeFileSync(out192Path, pngjs_1.PNG.sync.write(icon192));
    console.log('✓ Generated:', out192Path);
    // 3. Generate badge-icon.png (Android monochrome status bar badge)
    const badge = createMonochromeBadge(srcPng, 96, 96);
    const badgePath = path_1.default.join(iconsDir, 'badge-icon.png');
    fs_1.default.writeFileSync(badgePath, pngjs_1.PNG.sync.write(badge));
    console.log('✓ Generated:', badgePath);
    console.log('\nAll notification icon assets generated successfully!');
}
generateNotificationIcons();

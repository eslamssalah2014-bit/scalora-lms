"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pngjs_1 = require("pngjs");
function createPaddedSquare(src, bbox, targetSize, isBadge = false) {
    const dst = new pngjs_1.PNG({ width: targetSize, height: targetSize });
    // Initialize completely transparent
    for (let i = 0; i < dst.data.length; i += 4) {
        dst.data[i] = 0;
        dst.data[i + 1] = 0;
        dst.data[i + 2] = 0;
        dst.data[i + 3] = 0;
    }
    const emblemW = bbox.maxX - bbox.minX + 1;
    const emblemH = bbox.maxY - bbox.minY + 1;
    // We want the emblem to occupy ~80% of the target square canvas for clean padding
    const paddingRatio = isBadge ? 0.75 : 0.85;
    const maxEmblemDim = targetSize * paddingRatio;
    const scale = Math.min(maxEmblemDim / emblemW, maxEmblemDim / emblemH);
    const scaledW = Math.round(emblemW * scale);
    const scaledH = Math.round(emblemH * scale);
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
            if (alpha > 10) {
                const dstIdx = (targetSize * (offsetY + dy) + (offsetX + dx)) << 2;
                if (isBadge) {
                    // Pure white silhouette on transparent background (Android status bar standard)
                    dst.data[dstIdx] = 255;
                    dst.data[dstIdx + 1] = 255;
                    dst.data[dstIdx + 2] = 255;
                    dst.data[dstIdx + 3] = alpha;
                }
                else {
                    // Full color logo on transparent background
                    const topR = src.data[idx00] * (1 - cpx) + src.data[idx10] * cpx;
                    const botR = src.data[idx01] * (1 - cpx) + src.data[idx11] * cpx;
                    const topG = src.data[idx00 + 1] * (1 - cpx) + src.data[idx10 + 1] * cpx;
                    const botG = src.data[idx01 + 1] * (1 - cpx) + src.data[idx11 + 1] * cpx;
                    const topB = src.data[idx00 + 2] * (1 - cpx) + src.data[idx10 + 2] * cpx;
                    const botB = src.data[idx01 + 2] * (1 - cpx) + src.data[idx11 + 2] * cpx;
                    dst.data[dstIdx] = Math.round(topR * (1 - cpy) + botR * cpy);
                    dst.data[dstIdx + 1] = Math.round(topG * (1 - cpy) + botG * cpy);
                    dst.data[dstIdx + 2] = Math.round(topB * (1 - cpy) + botB * cpy);
                    dst.data[dstIdx + 3] = alpha;
                }
            }
        }
    }
    return dst;
}
async function generatePerfectIcons() {
    const publicDir = path_1.default.resolve(process.cwd(), '../client/public');
    const iconsDir = path_1.default.join(publicDir, 'icons');
    if (!fs_1.default.existsSync(iconsDir)) {
        fs_1.default.mkdirSync(iconsDir, { recursive: true });
    }
    const logoTransparentPath = path_1.default.join(publicDir, 'scalora-logo-transparent.png');
    const fileData = fs_1.default.readFileSync(logoTransparentPath);
    const src = pngjs_1.PNG.sync.read(fileData);
    // Find tight bounding box of the emblem
    let minX = src.width, maxX = 0, minY = src.height, maxY = 0;
    for (let y = 0; y < src.height; y++) {
        for (let x = 0; x < src.width; x++) {
            const a = src.data[(y * src.width + x) * 4 + 3];
            if (a > 20) {
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
    const bbox = { minX, minY, maxX, maxY };
    console.log('Scalora Logo Bounding Box:', bbox);
    // 1. notification-icon-96.png (96x96)
    const icon96 = createPaddedSquare(src, bbox, 96, false);
    const path96 = path_1.default.join(iconsDir, 'notification-icon-96.png');
    fs_1.default.writeFileSync(path96, pngjs_1.PNG.sync.write(icon96));
    console.log('✓ Wrote:', path96, `(${fs_1.default.statSync(path96).size} bytes)`);
    // 2. notification-icon-192.png (192x192)
    const icon192 = createPaddedSquare(src, bbox, 192, false);
    const path192 = path_1.default.join(iconsDir, 'notification-icon-192.png');
    fs_1.default.writeFileSync(path192, pngjs_1.PNG.sync.write(icon192));
    console.log('✓ Wrote:', path192, `(${fs_1.default.statSync(path192).size} bytes)`);
    // 3. badge-icon.png (96x96 pure white silhouette on transparent background)
    const badge = createPaddedSquare(src, bbox, 96, true);
    const pathBadge = path_1.default.join(iconsDir, 'badge-icon.png');
    fs_1.default.writeFileSync(pathBadge, pngjs_1.PNG.sync.write(badge));
    console.log('✓ Wrote:', pathBadge, `(${fs_1.default.statSync(pathBadge).size} bytes)`);
    // Verify transparency
    [path96, path192, pathBadge].forEach((p) => {
        const d = fs_1.default.readFileSync(p);
        const parsed = pngjs_1.PNG.sync.read(d);
        let trans = 0, opaq = 0;
        for (let i = 3; i < parsed.data.length; i += 4) {
            if (parsed.data[i] < 20)
                trans++;
            else
                opaq++;
        }
        console.log(`[Verification] ${path_1.default.basename(p)}: ${parsed.width}x${parsed.height} (Transparent: ${trans}, Opaque: ${opaq})`);
    });
}
generatePerfectIcons();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const asset_storage_service_js_1 = require("./services/asset-storage.service.js");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('====================================================');
    console.log('🧪 VERIFYING COMPLETE IMAGE PIPELINE INTEGRITY');
    console.log('====================================================\n');
    let passedTests = 0;
    let totalTests = 0;
    // TEST 1: Database Course Thumbnails
    console.log('TEST 1: Checking all courses in database...');
    totalTests++;
    const courses = await prisma.course.findMany();
    let allCoursesValid = true;
    for (const c of courses) {
        if (!c.thumbnail) {
            console.error(`❌ Course [${c.slug}] has no thumbnail!`);
            allCoursesValid = false;
        }
        else if (c.thumbnail.includes('scalora-lms-3')) {
            console.error(`❌ Course [${c.slug}] still has obsolete scalora-lms-3 URL: ${c.thumbnail}`);
            allCoursesValid = false;
        }
        else {
            console.log(`  ✓ Course [${c.slug}]: "${c.thumbnail}"`);
            // If HTTP URL, test fetch
            if (c.thumbnail.startsWith('http://') || c.thumbnail.startsWith('https://')) {
                try {
                    const res = await fetch(c.thumbnail, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
                    if (res.status >= 200 && res.status < 400) {
                        console.log(`    ✓ HTTP reachable (Status ${res.status})`);
                    }
                    else {
                        console.warn(`    ⚠️ HTTP status ${res.status} for ${c.thumbnail}`);
                    }
                }
                catch (e) {
                    console.warn(`    ⚠️ Fetch check timed out or failed: ${e.message}`);
                }
            }
        }
    }
    if (allCoursesValid) {
        console.log('✅ TEST 1 PASSED: All course thumbnails are valid and clean.\n');
        passedTests++;
    }
    else {
        console.error('❌ TEST 1 FAILED: Invalid course thumbnails detected.\n');
    }
    // TEST 2: Persistent PostgreSQL Asset Storage
    console.log('TEST 2: Testing persistent database asset engine...');
    totalTests++;
    const testFileName = `pipeline_test_${Date.now()}.png`;
    // Simple 1x1 transparent PNG buffer
    const samplePngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const saved = await asset_storage_service_js_1.AssetStorageService.saveAsset({
        buffer: samplePngBuffer,
        fileName: testFileName,
        mimeType: 'image/png',
        folder: 'tests',
        host: 'scalora-lms.onrender.com',
    });
    console.log(`  ✓ Saved asset to DB and disk: ID=${saved.id}, Path=${saved.path}`);
    // Verify in PostgreSQL table
    const inDb = await prisma.storedAsset.findUnique({
        where: { fileName: saved.fileName },
    });
    if (inDb && inDb.dataBase64) {
        console.log(`  ✓ Verified asset persisted in PostgreSQL table (size: ${inDb.size} bytes)`);
    }
    else {
        throw new Error('Asset was not found in stored_assets table!');
    }
    // TEST 3: Simulating Ephemeral Container Restart / Disk Wipe
    console.log('\nTEST 3: Simulating cloud container restart (local disk wipe)...');
    totalTests++;
    const diskPath = path_1.default.join(process.cwd(), 'uploads', 'tests', saved.fileName);
    if (fs_1.default.existsSync(diskPath)) {
        fs_1.default.unlinkSync(diskPath);
        console.log(`  ✓ Deleted file from local disk: ${diskPath}`);
    }
    // Retrieve asset via AssetStorageService
    const restored = await asset_storage_service_js_1.AssetStorageService.getAsset('tests', saved.fileName);
    if (restored && restored.buffer && restored.buffer.length === samplePngBuffer.length) {
        console.log(`  ✓ Successfully restored asset from PostgreSQL database! (Size: ${restored.buffer.length} bytes)`);
        // Verify it lazily recached to disk
        if (fs_1.default.existsSync(diskPath)) {
            console.log(`  ✓ Verified asset was lazily recached to local disk for fast subsequent reads.`);
            // Clean up test file
            fs_1.default.unlinkSync(diskPath);
        }
        console.log('✅ TEST 2 & 3 PASSED: Zero data loss persistence verified.\n');
        passedTests += 2;
    }
    else {
        console.error('❌ TEST 3 FAILED: Could not restore asset from database after disk wipe.\n');
    }
    // TEST 4: Fallback SVG Generator
    console.log('TEST 4: Testing SVG fallback generator...');
    totalTests++;
    const svg = asset_storage_service_js_1.AssetStorageService.getPlaceholderSvg('course', 'Test Course');
    if (svg && svg.includes('<svg') && svg.includes('SCALORA ACADEMY')) {
        console.log('  ✓ Generated valid, high-fidelity SVG fallback placeholder.');
        console.log('✅ TEST 4 PASSED: Fallback protection ready.\n');
        passedTests++;
    }
    else {
        console.error('❌ TEST 4 FAILED: Invalid SVG fallback.\n');
    }
    // TEST 5: Supabase Storage Public Buckets
    console.log('TEST 5: Checking Supabase public storage buckets...');
    totalTests++;
    const buckets = await prisma.$queryRawUnsafe('SELECT id, name, public FROM storage.buckets');
    console.log('  Active buckets in Supabase:', buckets.map((b) => `${b.id} (public=${b.public})`));
    const expectedBuckets = ['course-thumbnails', 'avatars', 'community', 'media'];
    const allBucketsPresent = expectedBuckets.every((eb) => buckets.some((b) => b.id === eb && b.public));
    if (allBucketsPresent) {
        console.log('✅ TEST 5 PASSED: All 4 Supabase public storage buckets verified.\n');
        passedTests++;
    }
    else {
        console.error('❌ TEST 5 FAILED: Some storage buckets missing or non-public.\n');
    }
    console.log('====================================================');
    console.log(`🏁 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================');
}
main()
    .catch((e) => {
    console.error('Verification failed with error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());

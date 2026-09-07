"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../lib/prisma.js");
async function runSafeMigration() {
    console.log('🚀 Running Safe Additive Migration for Coming Soon Courses Feature...');
    try {
        // 1. Add isComingSoon column if not exists
        console.log('1. Adding isComingSoon column to courses...');
        await prisma_js_1.prisma.$executeRawUnsafe(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS "isComingSoon" BOOLEAN DEFAULT FALSE;
    `);
        // 2. Add launchDate column if not exists
        console.log('2. Adding launchDate column to courses...');
        await prisma_js_1.prisma.$executeRawUnsafe(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS "launchDate" TIMESTAMP NULL;
    `);
        // 3. Add comingSoonDescription column if not exists
        console.log('3. Adding comingSoonDescription column to courses...');
        await prisma_js_1.prisma.$executeRawUnsafe(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS "comingSoonDescription" TEXT NULL;
    `);
        // 4. Create course_interest table if not exists
        console.log('4. Creating course_interest table if not exists...');
        await prisma_js_1.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS course_interest (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "course_interest_user_id_course_id_key" UNIQUE (user_id, course_id)
      );
    `);
        // Verify existing courses count
        const count = await prisma_js_1.prisma.course.count();
        console.log(`✅ Safe Additive Migration executed successfully! Total courses verified: ${count}`);
    }
    catch (error) {
        console.error('❌ Migration error:', error);
    }
    finally {
        await prisma_js_1.prisma.$disconnect();
    }
}
runSafeMigration();

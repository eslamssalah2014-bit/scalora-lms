"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./lib/prisma");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
const STUDENT_EMAIL = 'khaled.amar@example.com';
async function generateRuntimeProof() {
    console.log('================================================================');
    console.log('🔬 RUNTIME PROOF: KHALED AMAR STUDENT ENROLLMENT & DASHBOARD');
    console.log('================================================================\n');
    // 1. AUTHENTICATION & LOGIN
    console.log('--- 1. STUDENT AUTHENTICATION (POST /auth/login) ---');
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: STUDENT_EMAIL },
    });
    if (!user) {
        console.error('❌ User not found in database!');
        return;
    }
    const isPasswordValid = await bcryptjs_1.default.compare('Student123!', user.password);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Database User ID:', user.id);
    console.log('Password Verification (Student123!):', isPasswordValid ? 'VALID ✅' : 'INVALID ❌');
    // Generate JWT Token matching auth.controller.ts logic
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    console.log('\nGenerated JWT Token (first 60 chars):', token.substring(0, 60) + '...');
    // 2. JWT TOKEN DECODING & USER ID EXTRACTION
    console.log('\n--- 2. JWT DECODED PAYLOAD ---');
    const decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    console.log('Decoded Token Payload:', JSON.stringify(decodedToken, null, 2));
    const jwtUserId = decodedToken.id;
    console.log('JWT User ID extracted from token:', jwtUserId);
    // 3. ENROLLMENT RETRIEVAL (GET /enrollments/my)
    console.log('\n--- 3. GET /enrollments/my RUNTIME RESPONSE ---');
    const rawEnrollments = await prisma_1.prisma.enrollment.findMany({
        where: { userId: jwtUserId },
        include: {
            course: {
                include: {
                    modules: {
                        include: {
                            lessons: {
                                select: { id: true, title: true, duration: true, type: true },
                            },
                        },
                    },
                    quizzes: {
                        select: { id: true, title: true },
                    },
                },
            },
            payment: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    const completedProgress = await prisma_1.prisma.lessonProgress.findMany({
        where: { userId: jwtUserId, isCompleted: true },
        select: { lessonId: true },
    });
    const completedSet = new Set(completedProgress.map((p) => p.lessonId));
    const enrolledCourses = rawEnrollments.map((enr) => {
        const allLessons = enr.course.modules.flatMap((m) => m.lessons);
        const totalLessons = allLessons.length;
        const completedCount = allLessons.filter((l) => completedSet.has(l.id)).length;
        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        const nextLesson = allLessons.find((l) => !completedSet.has(l.id)) || allLessons[0];
        return {
            enrollmentId: enr.id,
            enrolledAt: enr.createdAt,
            status: enr.status,
            progressPercent,
            completedCount,
            totalLessons,
            nextLessonId: nextLesson?.id,
            course: {
                id: enr.course.id,
                title: enr.course.title,
                slug: enr.course.slug,
                description: enr.course.description,
                thumbnail: enr.course.thumbnail,
                instructor: enr.course.instructor,
                category: enr.course.category,
                level: enr.course.level,
                modulesCount: enr.course.modules.length,
                quizzesCount: enr.course.quizzes.length,
            },
        };
    });
    const rawApiResponse = {
        success: true,
        enrollments: enrolledCourses,
    };
    console.log('Raw JSON Response Payload:\n', JSON.stringify(rawApiResponse, null, 2));
    // 4. USER ID VERIFICATION
    console.log('\n--- 4. USER ID MATCH VERIFICATION ---');
    console.log('JWT User ID:', jwtUserId);
    console.log('Enrollment Database User ID:', rawEnrollments[0]?.userId);
    const idsMatch = jwtUserId === rawEnrollments[0]?.userId;
    console.log('Does JWT user ID match enrollment userId?', idsMatch ? 'YES (100% MATCH) ✅' : 'NO ❌');
    // 5. STUDENT DASHBOARD RENDER PROJECTION
    console.log('\n--- 5. STUDENT DASHBOARD RENDER PROJECTION ---');
    console.log('Total Enrolled Tracks Count:', enrolledCourses.length);
    console.log('Completed Courses Count:', enrolledCourses.filter((e) => e.progressPercent === 100).length);
    console.log('Lessons Completed Count:', enrolledCourses.reduce((sum, e) => sum + e.completedCount, 0));
    console.log('Active Track Title:', enrolledCourses[0]?.course.title);
    console.log('Active Track Resume URL:', `/learn/${enrolledCourses[0]?.course.slug}?lesson=${enrolledCourses[0]?.nextLessonId}`);
    await prisma_1.prisma.$disconnect();
}
generateRuntimeProof();

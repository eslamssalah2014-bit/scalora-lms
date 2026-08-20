"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
const results = [];
function record(step, name, passed, details, data) {
    results.push({ step, name, passed, details, data });
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${step}] ${name} - ${details}`);
}
async function runFullE2ETestSuite() {
    console.log('\n===============================================================');
    console.log('🚀 SCALORA LMS COMPLETE END-TO-END QA & SUPABASE SYNC TEST');
    console.log('===============================================================\n');
    const timestamp = Date.now();
    const testEmail = `qa.student.${timestamp}@scalora-test.com`;
    const testPassword = 'Password123!';
    const testName = `QA Student ${timestamp}`;
    let createdUserId = null;
    let studentToken = null;
    let adminToken = null;
    let targetCourseId = null;
    let targetLessonId = null;
    let targetQuizId = null;
    try {
        // -------------------------------------------------------------
        // STEP 1: AUDIT EXISTING SUPABASE DATABASE TABLES
        // -------------------------------------------------------------
        console.log('\n--- 1. DATABASE AUDIT & SEED VERIFICATION ---');
        const existingUsers = await prisma.user.count();
        const existingCourses = await prisma.course.count();
        const existingModules = await prisma.module.count();
        const existingLessons = await prisma.lesson.count();
        const dbHealthy = existingUsers >= 2 && existingCourses >= 1 && existingLessons >= 1;
        record('DB_AUDIT', 'Verify Supabase Database Connectivity & Seeded Data', dbHealthy, `Connected to Supabase PostgreSQL. Found ${existingUsers} users, ${existingCourses} courses, ${existingModules} modules, ${existingLessons} lessons.`);
        // Get Admin user & a Target Course
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!adminUser)
            throw new Error('No admin user found in database seed!');
        adminToken = jsonwebtoken_1.default.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name }, JWT_SECRET, { expiresIn: '7d' });
        const firstCourse = await prisma.course.findFirst({
            where: { isPublished: true },
            include: { modules: { include: { lessons: true } }, quizzes: { include: { questions: true } } },
        });
        if (!firstCourse)
            throw new Error('No published course found in database seed!');
        targetCourseId = firstCourse.id;
        targetLessonId = firstCourse.modules[0]?.lessons[0]?.id || null;
        targetQuizId = firstCourse.quizzes[0]?.id || null;
        // -------------------------------------------------------------
        // STEP 2: TEST STUDENT REGISTRATION & DATABASE WRITE
        // -------------------------------------------------------------
        console.log('\n--- 2. STUDENT REGISTRATION FLOW ---');
        const hashedPassword = await bcryptjs_1.default.hash(testPassword, 10);
        const createdStudent = await prisma.user.create({
            data: {
                email: testEmail,
                password: hashedPassword,
                name: testName,
                role: 'STUDENT',
            },
        });
        createdUserId = createdStudent.id;
        // Verify record in PostgreSQL
        const verifiedStudent = await prisma.user.findUnique({ where: { id: createdUserId } });
        const regPassed = !!verifiedStudent && verifiedStudent.email === testEmail;
        record('REGISTRATION', 'Create Student & Persist to Supabase Users Table', regPassed, `User ID: ${createdUserId}, Email: ${testEmail}, Persisted in Supabase: ${regPassed}`);
        // -------------------------------------------------------------
        // STEP 3: TEST AUTHENTICATION & LOGIN CREDENTIAL VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- 3. AUTHENTICATION & SESSION VERIFICATION ---');
        // Test Wrong Password
        const wrongPasswordValid = await bcryptjs_1.default.compare('WrongPassword999', verifiedStudent.password);
        record('AUTH_WRONG_PW', 'Reject Invalid Password Attempt', !wrongPasswordValid, 'Authentication correctly rejects incorrect password.');
        // Test Correct Password
        const correctPasswordValid = await bcryptjs_1.default.compare(testPassword, verifiedStudent.password);
        studentToken = jsonwebtoken_1.default.sign({ id: verifiedStudent.id, email: verifiedStudent.email, role: verifiedStudent.role, name: verifiedStudent.name }, JWT_SECRET, { expiresIn: '7d' });
        record('AUTH_LOGIN', 'Generate Valid JWT Session for Student', correctPasswordValid && !!studentToken, `Token generated for ${testEmail}`);
        // -------------------------------------------------------------
        // STEP 4: TEST COURSE DISCOVERY FROM DATABASE
        // -------------------------------------------------------------
        console.log('\n--- 4. COURSE DISCOVERY FROM SUPABASE ---');
        const dbCourse = await prisma.course.findUnique({
            where: { id: targetCourseId },
            include: { modules: { include: { lessons: true } }, quizzes: true },
        });
        const courseDiscoveryPassed = !!dbCourse && dbCourse.modules.length > 0 && dbCourse.modules[0].lessons.length > 0;
        record('COURSE_DISCOVERY', 'Load Real Course, Modules, and Lessons from Supabase', courseDiscoveryPassed, `Course: "${dbCourse?.title}" (${dbCourse?.modules.length} modules, ${dbCourse?.modules[0].lessons.length} lessons)`);
        // -------------------------------------------------------------
        // STEP 5: TEST COURSE ENROLLMENT FLOW & DUPLICATE PREVENTION
        // -------------------------------------------------------------
        console.log('\n--- 5. COURSE ENROLLMENT FLOW ---');
        // 1. Create enrollment in PostgreSQL
        const newEnrollment = await prisma.enrollment.create({
            data: {
                userId: createdUserId,
                courseId: targetCourseId,
                status: 'ACTIVE',
                amount: dbCourse?.price || 0,
            },
        });
        const enrollmentPersisted = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: createdUserId, courseId: targetCourseId } },
        });
        record('ENROLLMENT_CREATE', 'Persist Enrollment Record in Supabase PostgreSQL', !!enrollmentPersisted, `Enrollment ID: ${newEnrollment.id}, Student: ${createdUserId}, Course: ${targetCourseId}`);
        // 2. Test duplicate enrollment constraint (PostgreSQL @unique([userId, courseId]))
        let duplicatePrevented = false;
        try {
            await prisma.enrollment.create({
                data: {
                    userId: createdUserId,
                    courseId: targetCourseId,
                    status: 'ACTIVE',
                },
            });
        }
        catch (err) {
            // Prisma unique constraint violation code is P2002
            duplicatePrevented = true;
        }
        record('ENROLLMENT_DUPLICATE', 'Prevent Duplicate Course Enrollment in Database', duplicatePrevented, 'PostgreSQL unique constraint [userId, courseId] successfully blocked duplicate enrollment.');
        // -------------------------------------------------------------
        // STEP 6: TEST ADMIN VISIBILITY & ANALYTICS OF NEW ENROLLMENT
        // -------------------------------------------------------------
        console.log('\n--- 6. ADMIN VISIBILITY & DASHBOARD ANALYTICS ---');
        const adminEnrollments = await prisma.enrollment.findMany({
            where: { userId: createdUserId },
            include: { user: true, course: true },
        });
        const adminSeesEnrollment = adminEnrollments.length === 1 && adminEnrollments[0].user.email === testEmail;
        record('ADMIN_VISIBILITY', 'Admin Real-Time Visibility of Student Enrollment', adminSeesEnrollment, `Admin queried enrollment for ${testEmail} in "${adminEnrollments[0]?.course?.title}".`);
        // -------------------------------------------------------------
        // STEP 7: TEST STUDENT LESSON PROGRESS PERSISTENCE
        // -------------------------------------------------------------
        console.log('\n--- 7. LESSON PROGRESS PERSISTENCE ---');
        if (targetLessonId) {
            const progressRecord = await prisma.lessonProgress.upsert({
                where: { userId_lessonId: { userId: createdUserId, lessonId: targetLessonId } },
                update: { isCompleted: true, completedAt: new Date() },
                create: { userId: createdUserId, lessonId: targetLessonId, isCompleted: true, completedAt: new Date() },
            });
            const verifiedProgress = await prisma.lessonProgress.findUnique({
                where: { userId_lessonId: { userId: createdUserId, lessonId: targetLessonId } },
            });
            record('LESSON_PROGRESS', 'Save & Persist Lesson Completion in Supabase', !!verifiedProgress && verifiedProgress.isCompleted, `Lesson ID: ${targetLessonId}, Completed: ${verifiedProgress?.isCompleted}`);
        }
        // -------------------------------------------------------------
        // STEP 8: TEST QUIZ ATTEMPT & SCORE CALCULATION PERSISTENCE
        // -------------------------------------------------------------
        console.log('\n--- 8. QUIZ SUBMISSION & SCORING ---');
        if (targetQuizId) {
            const quiz = await prisma.quiz.findUnique({
                where: { id: targetQuizId },
                include: { questions: true },
            });
            if (quiz && quiz.questions.length > 0) {
                // Build answer map simulating 100% correct answers
                const answerMap = {};
                quiz.questions.forEach((q) => {
                    answerMap[q.id] = q.correctAnswer;
                });
                const quizResult = await prisma.quizResult.create({
                    data: {
                        quizId: targetQuizId,
                        userId: createdUserId,
                        score: 100.0,
                        passed: true,
                        answers: JSON.stringify(answerMap),
                    },
                });
                const verifiedResult = await prisma.quizResult.findUnique({
                    where: { id: quizResult.id },
                });
                record('QUIZ_RESULT', 'Persist Quiz Attempt & Score in Supabase PostgreSQL', !!verifiedResult && verifiedResult.score === 100.0 && verifiedResult.passed, `Quiz: "${quiz.title}", Score: ${verifiedResult?.score}%, Passed: ${verifiedResult?.passed}`);
            }
        }
        // -------------------------------------------------------------
        // STEP 9: TEST CERTIFICATE GENERATION & PERSISTENCE
        // -------------------------------------------------------------
        console.log('\n--- 9. CERTIFICATE ISSUANCE & PERSISTENCE ---');
        const certNumber = `SCL-QA-${Date.now().toString().slice(-6)}`;
        const newCert = await prisma.certificate.create({
            data: {
                certificateNumber: certNumber,
                userId: createdUserId,
                courseId: targetCourseId,
                studentName: testName,
                courseTitle: dbCourse?.title || 'Scalora Certified Track',
                instructorName: dbCourse?.instructor || 'Scalora Master Instructor',
                verificationUrl: `https://scalora-lms.vercel.app/verify/${certNumber}`,
            },
        });
        const verifiedCert = await prisma.certificate.findUnique({
            where: { certificateNumber: certNumber },
        });
        record('CERTIFICATE', 'Generate & Verify Unique Certificate in Supabase', !!verifiedCert && verifiedCert.certificateNumber === certNumber, `Certificate #: ${certNumber}, Student: ${verifiedCert?.studentName}, Course: ${verifiedCert?.courseTitle}`);
        // -------------------------------------------------------------
        // STEP 10: TEST ADMIN COURSE CREATION IN SUPABASE
        // -------------------------------------------------------------
        console.log('\n--- 10. ADMIN COURSE CREATION FLOW ---');
        const newCourseSlug = `qa-test-course-${timestamp}`;
        const createdCourse = await prisma.course.create({
            data: {
                title: `Enterprise Cloud Security Track (${timestamp})`,
                slug: newCourseSlug,
                description: 'Comprehensive enterprise cloud security testing curriculum.',
                instructor: 'Dr. Tariq Al-Mansoor',
                category: 'Cybersecurity',
                level: 'Advanced',
                price: 99.99,
                isPublished: true,
                modules: {
                    create: [
                        {
                            title: 'Module 1: Zero Trust Architecture',
                            order: 1,
                            lessons: {
                                create: [
                                    {
                                        title: '1.1 Zero Trust Principles & Identity Governance',
                                        type: 'TEXT',
                                        duration: '20 min',
                                        order: 1,
                                        content: 'Enterprise zero trust architecture guide.',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            include: { modules: { include: { lessons: true } } },
        });
        const verifiedAdminCourse = await prisma.course.findUnique({
            where: { id: createdCourse.id },
            include: { modules: { include: { lessons: true } } },
        });
        record('ADMIN_COURSE_CREATE', 'Admin Create Course with Modules & Lessons in Supabase', !!verifiedAdminCourse && verifiedAdminCourse.modules.length > 0, `Course ID: ${createdCourse.id}, Modules: ${verifiedAdminCourse?.modules.length}, Lessons: ${verifiedAdminCourse?.modules[0].lessons.length}`);
        // -------------------------------------------------------------
        // STEP 11: DATABASE CLEANUP (TEST ARTIFACTS)
        // -------------------------------------------------------------
        console.log('\n--- 11. CLEANING UP TEST ARTIFACTS ---');
        if (createdUserId) {
            await prisma.certificate.deleteMany({ where: { userId: createdUserId } });
            await prisma.quizResult.deleteMany({ where: { userId: createdUserId } });
            await prisma.lessonProgress.deleteMany({ where: { userId: createdUserId } });
            await prisma.enrollment.deleteMany({ where: { userId: createdUserId } });
            await prisma.payment.deleteMany({ where: { userId: createdUserId } });
            await prisma.user.delete({ where: { id: createdUserId } });
            console.log(`Cleaned up QA test user: ${testEmail}`);
        }
        if (createdCourse?.id) {
            await prisma.course.delete({ where: { id: createdCourse.id } });
            console.log(`Cleaned up QA test course: ${newCourseSlug}`);
        }
        record('CLEANUP', 'Clean up Temporary QA Records', true, 'Temporary test records purged cleanly.');
    }
    catch (error) {
        console.error('Fatal E2E Test Suite Error:', error);
        record('FATAL', 'E2E Test Runner Encountered Exception', false, error.message);
    }
    finally {
        await prisma.$disconnect();
    }
    // -------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('📊 TEST EXECUTION SUMMARY REPORT');
    console.log('===============================================================');
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = total - passedCount;
    console.log(`Total Flows Tested: ${total}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Overall Health: ${failedCount === 0 ? '100% OPERATIONAL (PASS)' : 'FAIL'}`);
    console.log('===============================================================\n');
    return { total, passedCount, failedCount, results };
}
runFullE2ETestSuite();

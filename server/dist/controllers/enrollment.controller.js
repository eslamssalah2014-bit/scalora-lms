"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualEnroll = exports.getAllEnrollmentsAdmin = exports.getMyEnrollments = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const community_service_js_1 = require("../services/community.service.js");
const manualEnrollSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
});
const getMyEnrollments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const enrollments = await prisma_js_1.prisma.enrollment.findMany({
            where: { userId },
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
            },
            orderBy: { createdAt: 'desc' },
        });
        // Fetch user's completed lesson IDs
        const completedProgress = await prisma_js_1.prisma.lessonProgress.findMany({
            where: { userId, isCompleted: true },
            select: { lessonId: true },
        });
        const completedSet = new Set(completedProgress.map((p) => p.lessonId));
        const enrolledCourses = enrollments
            .filter((enr) => Boolean(enr.course))
            .map((enr) => {
            const modules = enr.course.modules || [];
            const allLessons = modules.flatMap((m) => m.lessons || []);
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
                    modulesCount: modules.length,
                    quizzesCount: enr.course.quizzes ? enr.course.quizzes.length : 0,
                },
            };
        });
        res.json({ success: true, enrollments: enrolledCourses });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching enrollments' });
    }
};
exports.getMyEnrollments = getMyEnrollments;
const getAllEnrollmentsAdmin = async (_req, res) => {
    try {
        const enrollments = await prisma_js_1.prisma.enrollment.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
                course: {
                    select: { id: true, title: true, price: true, category: true },
                },
                payment: {
                    select: { id: true, transactionId: true, provider: true, status: true, currency: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, enrollments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching all enrollments' });
    }
};
exports.getAllEnrollmentsAdmin = getAllEnrollmentsAdmin;
const manualEnroll = async (req, res) => {
    try {
        const validatedData = manualEnrollSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: validatedData.userId } });
        if (!user) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const course = await prisma_js_1.prisma.course.findUnique({ where: { id: validatedData.courseId } });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const existing = await prisma_js_1.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: validatedData.userId,
                    courseId: validatedData.courseId,
                },
            },
        });
        if (existing) {
            res.status(400).json({ success: false, message: 'Student is already enrolled in this course' });
            return;
        }
        // Create a manual admin payment transaction record in PostgreSQL
        const payment = await prisma_js_1.prisma.payment.create({
            data: {
                userId: validatedData.userId,
                courseId: validatedData.courseId,
                amount: 0.0,
                currency: 'USD',
                status: 'COMPLETED',
                provider: 'ADMIN_MANUAL',
                transactionId: `manual_adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            },
        });
        const enrollment = await prisma_js_1.prisma.enrollment.create({
            data: {
                userId: validatedData.userId,
                courseId: validatedData.courseId,
                status: 'ACTIVE',
                amount: 0.0,
                paymentId: payment.id,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true } },
                payment: true,
            },
        });
        // Automatically add student to course Community Channel
        await community_service_js_1.communityService.autoEnrollInChannel(validatedData.userId, validatedData.courseId);
        res.status(201).json({
            success: true,
            message: `Enrolled ${user.name} into ${course.title} successfully`,
            enrollment,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating manual enrollment' });
    }
};
exports.manualEnroll = manualEnroll;

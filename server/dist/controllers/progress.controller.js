"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificate = exports.getCourseProgress = exports.toggleLessonProgress = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const toggleLessonProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { lessonId, isCompleted } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!lessonId) {
            res.status(400).json({ success: false, message: 'Lesson ID is required' });
            return;
        }
        const lesson = await prisma_js_1.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: true },
        });
        if (!lesson) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        const existing = await prisma_js_1.prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });
        const targetCompleted = isCompleted !== undefined ? isCompleted : !(existing?.isCompleted ?? false);
        const progress = await prisma_js_1.prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
            update: {
                isCompleted: targetCompleted,
                completedAt: targetCompleted ? new Date() : null,
            },
            create: {
                userId,
                lessonId,
                isCompleted: targetCompleted,
                completedAt: targetCompleted ? new Date() : null,
            },
        });
        // Check if course is now 100% complete
        const courseModules = await prisma_js_1.prisma.module.findMany({
            where: { courseId: lesson.module.courseId },
            include: { lessons: { select: { id: true } } },
        });
        const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
        const completedProgress = await prisma_js_1.prisma.lessonProgress.findMany({
            where: {
                userId,
                lessonId: { in: allLessonIds },
                isCompleted: true,
            },
        });
        const isCourseCompleted = allLessonIds.length > 0 && completedProgress.length >= allLessonIds.length;
        if (isCourseCompleted) {
            await prisma_js_1.prisma.enrollment.updateMany({
                where: { userId, courseId: lesson.module.courseId },
                data: { status: 'COMPLETED' },
            });
            // Automatically issue & persist Certificate in PostgreSQL
            const user = await prisma_js_1.prisma.user.findUnique({ where: { id: userId } });
            const course = await prisma_js_1.prisma.course.findUnique({ where: { id: lesson.module.courseId } });
            if (user && course) {
                const certNumber = `SCL-${course.id.slice(-6).toUpperCase()}-${user.id.slice(-6).toUpperCase()}`;
                await prisma_js_1.prisma.certificate.upsert({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId: course.id,
                        },
                    },
                    update: {},
                    create: {
                        certificateNumber: certNumber,
                        userId,
                        courseId: course.id,
                        studentName: user.name,
                        courseTitle: course.title,
                        instructorName: course.instructor,
                        verificationUrl: `https://scalora.com/verify/${certNumber}`,
                    },
                });
            }
        }
        res.json({
            success: true,
            progress,
            isCourseCompleted,
            completionPercentage: allLessonIds.length > 0 ? Math.round((completedProgress.length / allLessonIds.length) * 100) : 0,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating lesson progress' });
    }
};
exports.toggleLessonProgress = toggleLessonProgress;
const getCourseProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const courseId = req.params.courseId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: { select: { id: true } },
                    },
                },
            },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const completedProgress = await prisma_js_1.prisma.lessonProgress.findMany({
            where: {
                userId,
                lessonId: { in: allLessonIds },
                isCompleted: true,
            },
            select: { lessonId: true, completedAt: true },
        });
        const completedLessonIds = completedProgress.map((p) => p.lessonId);
        const percentage = allLessonIds.length > 0 ? Math.round((completedLessonIds.length / allLessonIds.length) * 100) : 0;
        res.json({
            success: true,
            progress: {
                courseId,
                totalLessons: allLessonIds.length,
                completedLessonsCount: completedLessonIds.length,
                completedLessonIds,
                completionPercentage: percentage,
                isCompleted: percentage === 100,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching progress' });
    }
};
exports.getCourseProgress = getCourseProgress;
const getCertificate = async (req, res) => {
    try {
        const userId = req.user?.id;
        const courseId = req.params.courseId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: userId } });
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: { select: { id: true } },
                    },
                },
            },
        });
        if (!user || !course) {
            res.status(404).json({ success: false, message: 'User or Course not found' });
            return;
        }
        const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const completedProgress = await prisma_js_1.prisma.lessonProgress.findMany({
            where: {
                userId,
                lessonId: { in: allLessonIds },
                isCompleted: true,
            },
        });
        const isCompleted = allLessonIds.length > 0 && completedProgress.length >= allLessonIds.length;
        // Check enrollment
        const enrollment = await prisma_js_1.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
        if (!enrollment) {
            res.status(403).json({ success: false, message: 'Student is not enrolled in this course' });
            return;
        }
        const certNumber = `SCL-${course.id.slice(-6).toUpperCase()}-${user.id.slice(-6).toUpperCase()}`;
        // Persist or retrieve from PostgreSQL Certificate table
        let cert = await prisma_js_1.prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
        if (!cert && (isCompleted || req.user?.role === 'ADMIN')) {
            cert = await prisma_js_1.prisma.certificate.create({
                data: {
                    certificateNumber: certNumber,
                    userId,
                    courseId,
                    studentName: user.name,
                    courseTitle: course.title,
                    instructorName: course.instructor,
                    verificationUrl: `https://scalora.com/verify/${certNumber}`,
                },
            });
        }
        res.json({
            success: true,
            eligible: isCompleted || req.user?.role === 'ADMIN' || Boolean(cert),
            certificate: cert
                ? {
                    certificateId: cert.certificateNumber,
                    studentName: cert.studentName,
                    courseTitle: cert.courseTitle,
                    instructor: cert.instructorName,
                    completionDate: cert.issueDate,
                    verificationUrl: cert.verificationUrl,
                }
                : {
                    certificateId: certNumber,
                    studentName: user.name,
                    courseTitle: course.title,
                    instructor: course.instructor,
                    completionDate: new Date(),
                    verificationUrl: `https://scalora.com/verify/${certNumber}`,
                },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error generating certificate' });
    }
};
exports.getCertificate = getCertificate;

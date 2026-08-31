"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLesson = exports.updateLesson = exports.createLesson = exports.getLessonById = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const bunny_service_js_1 = require("../services/bunny.service.js");
const lessonSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Lesson title must be at least 2 characters'),
    type: zod_1.z.enum(['YOUTUBE', 'PDF', 'DOWNLOAD', 'TEXT']),
    content: zod_1.z.string().optional().nullable(),
    videoProvider: zod_1.z.string().optional().nullable(),
    videoId: zod_1.z.string().optional().nullable(),
    videoUrl: zod_1.z.string().optional().nullable(),
    fileUrl: zod_1.z.string().optional().nullable(),
    fileName: zod_1.z.string().optional().nullable(),
    fileSize: zod_1.z.string().optional().nullable(),
    duration: zod_1.z.string().optional().nullable(),
    order: zod_1.z.number().optional().default(0),
    moduleId: zod_1.z.string().min(1, 'Module ID is required'),
});
const getLessonById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const lesson = await prisma_js_1.prisma.lesson.findUnique({
            where: { id },
            include: {
                module: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
        if (!lesson) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        // Check enrollment if student
        if (req.user?.role !== 'ADMIN') {
            const enrollment = await prisma_js_1.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: userId,
                        courseId: lesson.module.courseId,
                    },
                },
            });
            if (!enrollment) {
                res.status(403).json({ success: false, message: 'You must be enrolled in this course to access this lesson' });
                return;
            }
        }
        let isCompleted = false;
        if (userId) {
            const progress = await prisma_js_1.prisma.lessonProgress.findUnique({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId: id,
                    },
                },
            });
            isCompleted = progress?.isCompleted ?? false;
        }
        // Dynamic embed URL calculation for Bunny videos (runtime only - never modifies DB)
        const effectiveProvider = (lesson.videoProvider || 'youtube').toLowerCase();
        let dynamicEmbedUrl = null;
        if (effectiveProvider === 'bunny' && (lesson.videoId || lesson.videoUrl)) {
            const rawId = lesson.videoId || lesson.videoUrl;
            if (rawId) {
                dynamicEmbedUrl = bunny_service_js_1.bunnyService.buildEmbedUrl({ videoId: rawId });
            }
        }
        res.json({
            success: true,
            lesson: {
                ...lesson,
                videoProvider: effectiveProvider,
                videoId: lesson.videoId || null,
                dynamicEmbedUrl,
                isCompleted,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching lesson' });
    }
};
exports.getLessonById = getLessonById;
const createLesson = async (req, res) => {
    try {
        const validatedData = lessonSchema.parse(req.body);
        const moduleItem = await prisma_js_1.prisma.module.findUnique({ where: { id: validatedData.moduleId } });
        if (!moduleItem) {
            res.status(404).json({ success: false, message: 'Module not found' });
            return;
        }
        let order = validatedData.order;
        if (order === 0) {
            const highestLesson = await prisma_js_1.prisma.lesson.findFirst({
                where: { moduleId: validatedData.moduleId },
                orderBy: { order: 'desc' },
            });
            order = (highestLesson?.order ?? -1) + 1;
        }
        // Determine normalized videoProvider and extract clean videoId if Bunny
        const rawProvider = (validatedData.videoProvider || 'youtube').toLowerCase();
        const isBunny = rawProvider === 'bunny';
        const videoProvider = isBunny ? 'bunny' : 'youtube';
        let videoId = null;
        let videoUrl = validatedData.videoUrl || null;
        if (isBunny) {
            // Extract clean videoId from raw UUID or pasted Play/Embed URL
            const candidateInput = validatedData.videoId || validatedData.videoUrl;
            videoId = bunny_service_js_1.bunnyService.extractVideoId(candidateInput) || candidateInput || null;
            // Do not store full URL in videoUrl if Bunny is selected, or preserve if provided
        }
        const lesson = await prisma_js_1.prisma.lesson.create({
            data: {
                title: validatedData.title,
                type: validatedData.type,
                content: validatedData.content || null,
                videoProvider,
                videoId,
                videoUrl,
                fileUrl: validatedData.fileUrl || null,
                fileName: validatedData.fileName || null,
                fileSize: validatedData.fileSize || null,
                duration: validatedData.duration || null,
                order,
                moduleId: validatedData.moduleId,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            lesson: {
                ...lesson,
                videoProvider: lesson.videoProvider || 'youtube',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating lesson' });
    }
};
exports.createLesson = createLesson;
const updateLesson = async (req, res) => {
    try {
        const id = req.params.id;
        const validatedData = lessonSchema.partial().parse(req.body);
        const existing = await prisma_js_1.prisma.lesson.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        const updateData = { ...validatedData };
        if (validatedData.videoProvider !== undefined) {
            const rawProvider = (validatedData.videoProvider || 'youtube').toLowerCase();
            const isBunny = rawProvider === 'bunny';
            updateData.videoProvider = isBunny ? 'bunny' : 'youtube';
            if (isBunny) {
                const candidateInput = validatedData.videoId !== undefined ? validatedData.videoId : validatedData.videoUrl;
                if (candidateInput) {
                    updateData.videoId = bunny_service_js_1.bunnyService.extractVideoId(candidateInput) || candidateInput;
                }
            }
        }
        else if (validatedData.videoId !== undefined) {
            // If videoId is provided directly
            updateData.videoId = bunny_service_js_1.bunnyService.extractVideoId(validatedData.videoId) || validatedData.videoId;
        }
        const updated = await prisma_js_1.prisma.lesson.update({
            where: { id },
            data: updateData,
        });
        res.json({
            success: true,
            message: 'Lesson updated successfully',
            lesson: {
                ...updated,
                videoProvider: updated.videoProvider || 'youtube',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error updating lesson' });
    }
};
exports.updateLesson = updateLesson;
const deleteLesson = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_js_1.prisma.lesson.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        await prisma_js_1.prisma.lesson.delete({ where: { id } });
        res.json({ success: true, message: 'Lesson deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting lesson' });
    }
};
exports.deleteLesson = deleteLesson;

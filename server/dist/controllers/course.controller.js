"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCourseThumbnail = exports.getUpcomingCourses = exports.removeCourseInterest = exports.registerCourseInterest = exports.deleteCategory = exports.createCategory = exports.getCategories = exports.togglePublishCourse = exports.deleteCourse = exports.updateCoursePricing = exports.updateCourse = exports.createCourse = exports.getCourseBySlug = exports.getAllCoursesAdmin = exports.getPublishedCourses = void 0;
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_js_1 = require("../lib/prisma.js");
const community_service_js_1 = require("../services/community.service.js");
const audit_service_js_1 = require("../services/audit.service.js");
const course_pricing_service_js_1 = require("../services/course-pricing.service.js");
const realtime_service_js_1 = require("../services/realtime.service.js");
const webpush_service_js_1 = require("../services/webpush.service.js");
const courseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    thumbnail: zod_1.z.string().optional().or(zod_1.z.literal('')),
    thumbnail_url: zod_1.z.string().optional().or(zod_1.z.literal('')),
    price: zod_1.z.number().min(0, 'Price must be 0 or positive').default(0),
    basePrice: zod_1.z.number().min(0, 'Base price must be 0 or positive').optional(),
    discountPrice: zod_1.z.number().min(0, 'Discount price must be 0 or positive').optional(),
    discountedPrice: zod_1.z.number().min(0, 'Discount price must be 0 or positive').optional(),
    instructor: zod_1.z.string().min(2, 'Instructor name is required'),
    category: zod_1.z.string().min(2, 'Category is required'),
    level: zod_1.z.string().optional().default('All Levels'),
    isPublished: zod_1.z.boolean().optional().default(false),
    isComingSoon: zod_1.z.boolean().optional().default(false),
    launchDate: zod_1.z.string().nullable().optional(),
    comingSoonDescription: zod_1.z.string().nullable().optional().or(zod_1.z.literal('')),
    trainerIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
const getPublishedCourses = async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        const where = { isPublished: true };
        if (category && typeof category === 'string' && category !== 'All') {
            where.category = { equals: category };
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { instructor: { contains: search } },
            ];
        }
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price-low') {
            orderBy = { price: 'asc' };
        }
        else if (sort === 'price-high') {
            orderBy = { price: 'desc' };
        }
        else if (sort === 'title') {
            orderBy = { title: 'asc' };
        }
        const courses = await prisma_js_1.prisma.course.findMany({
            where,
            orderBy,
            include: {
                modules: {
                    include: {
                        lessons: {
                            select: { id: true, duration: true, type: true },
                        },
                    },
                },
                quizzes: {
                    select: { id: true, title: true },
                },
                trainers: {
                    include: {
                        trainer: {
                            select: { id: true, name: true, avatar: true, title: true, bio: true, linkedin: true, website: true },
                        },
                    },
                },
                _count: {
                    select: { enrollments: true, interests: true },
                },
            },
        });
        const formatted = courses.map((course) => {
            const allLessons = course.modules.flatMap((m) => m.lessons);
            const pricing = course_pricing_service_js_1.coursePricingService.getPricing(course.id, course.price);
            const basePrice = pricing.basePrice > 0 ? pricing.basePrice : (course.price > 0 ? course.price : 0);
            const discountPrice = pricing.discountPrice > 0 ? pricing.discountPrice : basePrice;
            const effectivePrice = discountPrice > 0 && discountPrice < basePrice ? discountPrice : basePrice;
            return {
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description,
                comingSoonDescription: course.comingSoonDescription,
                thumbnail: course.thumbnail,
                price: effectivePrice,
                basePrice,
                discountPrice,
                discountPercent: pricing.discountPercent,
                currency: 'EGP',
                instructor: course.instructor,
                category: course.category,
                level: course.level,
                isPublished: course.isPublished,
                isComingSoon: course.isComingSoon || false,
                launchDate: course.launchDate,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                modulesCount: course.modules.length,
                lessonsCount: allLessons.length,
                quizzesCount: course.quizzes.length,
                studentsCount: course._count.enrollments,
                interestsCount: course._count.interests || 0,
                trainers: course.trainers.map((t) => t.trainer),
            };
        });
        res.json({ success: true, courses: formatted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching courses' });
    }
};
exports.getPublishedCourses = getPublishedCourses;
const getAllCoursesAdmin = async (_req, res) => {
    try {
        const courses = await prisma_js_1.prisma.course.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                quizzes: true,
                trainers: {
                    include: {
                        trainer: {
                            select: { id: true, name: true, avatar: true, title: true },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        interests: true,
                    },
                },
            },
        });
        const formatted = courses.map((course) => {
            const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            const pricing = course_pricing_service_js_1.coursePricingService.getPricing(course.id, course.price);
            const basePrice = pricing.basePrice > 0 ? pricing.basePrice : (course.price > 0 ? course.price : 0);
            const discountPrice = pricing.discountPrice > 0 ? pricing.discountPrice : basePrice;
            const effectivePrice = discountPrice > 0 && discountPrice < basePrice ? discountPrice : basePrice;
            return {
                ...course,
                isComingSoon: course.isComingSoon || false,
                launchDate: course.launchDate,
                comingSoonDescription: course.comingSoonDescription,
                modules: course.modules.map((m) => ({
                    ...m,
                    lessons: m.lessons.map((l) => ({
                        ...l,
                        videoProvider: l.videoProvider || 'youtube',
                        videoId: l.videoId || null,
                    })),
                })),
                price: effectivePrice,
                basePrice,
                discountPrice,
                discountPercent: pricing.discountPercent,
                currency: 'EGP',
                lessonsCount: totalLessons,
                quizzesCount: course.quizzes.length,
                studentsCount: course._count.enrollments,
                interestsCount: course._count.interests || 0,
                trainers: course.trainers.map((t) => t.trainer),
            };
        });
        res.json({ success: true, courses: formatted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching admin courses' });
    }
};
exports.getAllCoursesAdmin = getAllCoursesAdmin;
const getCourseBySlug = async (req, res) => {
    try {
        const slug = req.params.slug;
        const userId = req.user?.id;
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { slug },
            include: {
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                videoProvider: true,
                                videoId: true,
                                duration: true,
                                order: true,
                                fileName: true,
                                fileSize: true,
                                content: true,
                                videoUrl: true,
                                fileUrl: true,
                            },
                        },
                    },
                },
                quizzes: {
                    include: {
                        questions: {
                            select: {
                                id: true,
                                question: true,
                                options: true,
                                order: true,
                                correctAnswer: true,
                                explanation: true,
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                trainers: {
                    include: {
                        trainer: {
                            select: { id: true, name: true, avatar: true, title: true, bio: true, linkedin: true, website: true },
                        },
                    },
                },
                _count: {
                    select: { enrollments: true, interests: true },
                },
            },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        let isEnrolled = false;
        let isInterested = false;
        let progressSummary = {
            completedLessonIds: [],
            completionPercentage: 0,
        };
        if (userId) {
            const [enrollment, interest] = await Promise.all([
                prisma_js_1.prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId: course.id,
                        },
                    },
                }),
                prisma_js_1.prisma.courseInterest.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId: course.id,
                        },
                    },
                }),
            ]);
            if (enrollment || req.user?.role === 'ADMIN') {
                isEnrolled = true;
            }
            if (interest) {
                isInterested = true;
            }
            const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
            if (allLessonIds.length > 0) {
                const completedProgress = await prisma_js_1.prisma.lessonProgress.findMany({
                    where: {
                        userId,
                        lessonId: { in: allLessonIds },
                        isCompleted: true,
                    },
                    select: { lessonId: true },
                });
                const completedIds = completedProgress.map((p) => p.lessonId);
                const percentage = Math.round((completedIds.length / allLessonIds.length) * 100);
                progressSummary = {
                    completedLessonIds: completedIds,
                    completionPercentage: percentage,
                };
            }
        }
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        const pricing = course_pricing_service_js_1.coursePricingService.getPricing(course.id, course.price);
        const basePrice = pricing.basePrice > 0 ? pricing.basePrice : (course.price > 0 ? course.price : 0);
        const discountPrice = pricing.discountPrice > 0 ? pricing.discountPrice : basePrice;
        const effectivePrice = discountPrice > 0 && discountPrice < basePrice ? discountPrice : basePrice;
        res.json({
            success: true,
            course: {
                ...course,
                isComingSoon: course.isComingSoon || false,
                launchDate: course.launchDate,
                comingSoonDescription: course.comingSoonDescription,
                modules: course.modules.map((m) => ({
                    ...m,
                    lessons: m.lessons.map((l) => ({
                        ...l,
                        videoProvider: l.videoProvider || 'youtube',
                        videoId: l.videoId || null,
                    })),
                })),
                price: effectivePrice,
                basePrice,
                discountPrice,
                discountPercent: pricing.discountPercent,
                currency: 'EGP',
                lessonsCount: totalLessons,
                studentsCount: course._count.enrollments,
                interestsCount: course._count.interests || 0,
                isEnrolled,
                isInterested,
                userProgress: progressSummary,
                trainers: course.trainers.map((t) => t.trainer),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching course details' });
    }
};
exports.getCourseBySlug = getCourseBySlug;
const createCourse = async (req, res) => {
    try {
        const validatedData = courseSchema.parse(req.body);
        const { trainerIds, basePrice, discountPrice, discountedPrice, launchDate, thumbnail_url, ...courseData } = validatedData;
        let slug = courseData.slug || generateSlug(courseData.title);
        const existing = await prisma_js_1.prisma.course.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const initialBase = typeof basePrice === 'number' ? basePrice : (courseData.price || 0);
        const initialDiscount = typeof discountPrice === 'number'
            ? discountPrice
            : (typeof discountedPrice === 'number' ? discountedPrice : initialBase);
        const effectivePrice = initialDiscount > 0 && initialDiscount < initialBase ? initialDiscount : initialBase;
        // Map thumbnail strictly to Prisma Course model's thumbnail field
        const effectiveThumbnail = courseData.thumbnail ||
            thumbnail_url ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
        const course = await prisma_js_1.prisma.course.create({
            data: {
                title: courseData.title,
                slug,
                description: courseData.description,
                comingSoonDescription: courseData.comingSoonDescription || null,
                thumbnail: effectiveThumbnail,
                price: effectivePrice,
                instructor: courseData.instructor,
                category: courseData.category,
                level: courseData.level || 'All Levels',
                isPublished: courseData.isPublished || false,
                isComingSoon: courseData.isComingSoon || false,
                launchDate: launchDate ? new Date(launchDate) : null,
            },
        });
        // Save custom pricing
        const pricing = course_pricing_service_js_1.coursePricingService.setPricing(course.id, initialBase, initialDiscount);
        // Assign trainers if provided
        if (trainerIds && trainerIds.length > 0) {
            const uniqueTrainerIds = Array.from(new Set(trainerIds.filter(Boolean)));
            const validUsers = await prisma_js_1.prisma.user.findMany({
                where: { id: { in: uniqueTrainerIds }, deletedAt: null },
                select: { id: true },
            });
            const validUserIds = validUsers.map((u) => u.id);
            for (const tId of validUserIds) {
                await prisma_js_1.prisma.courseTrainer.create({
                    data: {
                        courseId: course.id,
                        trainerId: tId,
                    },
                });
            }
        }
        // Automatically create linked Community Channel for this course
        await community_service_js_1.communityService.ensureCourseChannel(course.id, course.title, course.description);
        // Audit Log
        await audit_service_js_1.auditService.log({
            action: 'COURSE_CREATED',
            entityType: 'COURSE',
            entityId: course.id,
            userId: req.user?.id,
            newData: course,
            metadata: { adminEmail: req.user?.email, adminName: req.user?.name },
        });
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course: {
                ...course,
                price: effectivePrice,
                basePrice: pricing.basePrice,
                discountPrice: pricing.discountPrice,
                discountPercent: pricing.discountPercent,
                currency: 'EGP',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating course' });
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res) => {
    try {
        const id = req.params.id;
        const validatedData = courseSchema.partial().parse(req.body);
        const { trainerIds, basePrice, discountPrice, discountedPrice, launchDate, thumbnail_url, ...courseData } = validatedData;
        const existing = await prisma_js_1.prisma.course.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        // Handle pricing updates
        let effectivePrice = existing.price;
        if (basePrice !== undefined || discountPrice !== undefined || discountedPrice !== undefined || courseData.price !== undefined) {
            const currentPricing = course_pricing_service_js_1.coursePricingService.getPricing(id, existing.price);
            const newBase = typeof basePrice === 'number'
                ? basePrice
                : (typeof courseData.price === 'number' ? courseData.price : currentPricing.basePrice);
            const newDiscount = typeof discountPrice === 'number'
                ? discountPrice
                : (typeof discountedPrice === 'number' ? discountedPrice : (typeof basePrice === 'number' ? basePrice : currentPricing.discountPrice));
            const updatedPricing = course_pricing_service_js_1.coursePricingService.setPricing(id, newBase, newDiscount);
            effectivePrice = updatedPricing.discountPrice > 0 && updatedPricing.discountPrice < updatedPricing.basePrice
                ? updatedPricing.discountPrice
                : updatedPricing.basePrice;
            courseData.price = effectivePrice;
        }
        // Build strictly valid Prisma update payload (ONLY Course schema properties)
        const updatePayload = { ...courseData };
        if (launchDate !== undefined) {
            updatePayload.launchDate = launchDate ? new Date(launchDate) : null;
        }
        if (courseData.thumbnail !== undefined) {
            updatePayload.thumbnail = courseData.thumbnail || null;
        }
        else if (thumbnail_url !== undefined) {
            updatePayload.thumbnail = thumbnail_url || null;
        }
        // Safeguard: Strip any non-Course-model fields to prevent Prisma "Unknown argument" runtime exceptions
        delete updatePayload.thumbnail_url;
        delete updatePayload.trainerIds;
        delete updatePayload.basePrice;
        delete updatePayload.discountPrice;
        delete updatePayload.discountedPrice;
        const updated = await prisma_js_1.prisma.course.update({
            where: { id },
            data: updatePayload,
        });
        // Check if course was previously Coming Soon and is now released (isComingSoon changed from true to false)
        const wasComingSoon = existing.isComingSoon === true;
        const isNowReleased = wasComingSoon && courseData.isComingSoon === false;
        if (isNowReleased) {
            try {
                const interestedUsers = await prisma_js_1.prisma.courseInterest.findMany({
                    where: { courseId: id },
                    select: { userId: true },
                });
                const recipientIds = interestedUsers.map((item) => item.userId);
                if (recipientIds.length > 0) {
                    const notifMessage = `[🚀 The course you were waiting for is now available!]: "${updated.title}" is now open for enrollment.`;
                    // 1. In-app notifications
                    await prisma_js_1.prisma.communityNotification.createMany({
                        data: recipientIds.map((userId) => ({
                            userId,
                            actorId: req.user?.id || null,
                            type: 'COURSE_ANNOUNCEMENT',
                            message: notifMessage,
                            isRead: false,
                        })),
                    });
                    // 2. Realtime SSE push
                    recipientIds.forEach((uid) => {
                        realtime_service_js_1.realtimeService.sendToUser(uid, 'notification', {
                            notification: {
                                type: 'COURSE_ANNOUNCEMENT',
                                title: '🚀 The course you were waiting for is now available!',
                                message: `"${updated.title}" is now open for enrollment.`,
                                actionUrl: `/courses/${updated.slug}`,
                                isRead: false,
                                createdAt: new Date().toISOString(),
                            },
                        });
                    });
                    // 3. Web Push OS Notification
                    webpush_service_js_1.webPushService
                        .sendPushToUsers(recipientIds, {
                        title: '🚀 The course you were waiting for is now available!',
                        body: `"${updated.title}" is now open for enrollment.`,
                        url: `/courses/${updated.slug}`,
                        type: 'COURSE_ANNOUNCEMENT',
                    })
                        .catch((err) => console.error('[Push Notification Error]', err));
                }
            }
            catch (notifyErr) {
                console.error('Error sending coming soon release notifications:', notifyErr);
            }
        }
        // Sync trainers if array provided
        if (trainerIds !== undefined) {
            await prisma_js_1.prisma.courseTrainer.deleteMany({
                where: { courseId: id },
            });
            const uniqueTrainerIds = Array.from(new Set(trainerIds.filter(Boolean)));
            if (uniqueTrainerIds.length > 0) {
                const validUsers = await prisma_js_1.prisma.user.findMany({
                    where: { id: { in: uniqueTrainerIds }, deletedAt: null },
                    select: { id: true },
                });
                const validUserIds = validUsers.map((u) => u.id);
                for (const tId of validUserIds) {
                    await prisma_js_1.prisma.courseTrainer.create({
                        data: {
                            courseId: id,
                            trainerId: tId,
                        },
                    });
                }
            }
        }
        // Audit Log
        await audit_service_js_1.auditService.log({
            action: 'COURSE_UPDATED',
            entityType: 'COURSE',
            entityId: id,
            userId: req.user?.id,
            oldData: existing,
            newData: updated,
            metadata: { adminEmail: req.user?.email, adminName: req.user?.name },
        });
        const finalPricing = course_pricing_service_js_1.coursePricingService.getPricing(id, updated.price);
        res.json({
            success: true,
            message: 'Course updated successfully',
            course: {
                ...updated,
                price: effectivePrice,
                basePrice: finalPricing.basePrice,
                discountPrice: finalPricing.discountPrice,
                discountPercent: finalPricing.discountPercent,
                currency: 'EGP',
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error updating course' });
    }
};
exports.updateCourse = updateCourse;
const updateCoursePricing = async (req, res) => {
    try {
        const id = req.params.id;
        const { basePrice, discountPrice, discountedPrice } = req.body;
        const base = Number(basePrice);
        if (isNaN(base) || base < 0) {
            res.status(400).json({ success: false, message: 'Valid basePrice is required' });
            return;
        }
        const discountRaw = discountPrice !== undefined ? discountPrice : discountedPrice;
        const discount = discountRaw !== undefined && discountRaw !== null && discountRaw !== ''
            ? Number(discountRaw)
            : base;
        if (isNaN(discount) || discount < 0) {
            res.status(400).json({ success: false, message: 'Discounted price cannot be negative' });
            return;
        }
        if (discount > base) {
            res.status(400).json({ success: false, message: 'Discounted price cannot be greater than Base Price' });
            return;
        }
        const course = await prisma_js_1.prisma.course.findUnique({ where: { id } });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const pricing = course_pricing_service_js_1.coursePricingService.setPricing(id, base, discount);
        const effectivePrice = pricing.discountPrice > 0 && pricing.discountPrice < pricing.basePrice
            ? pricing.discountPrice
            : pricing.basePrice;
        await prisma_js_1.prisma.course.update({
            where: { id },
            data: { price: effectivePrice },
        });
        res.json({
            success: true,
            message: 'Course pricing updated successfully',
            pricing: {
                ...pricing,
                effectivePrice,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating course pricing' });
    }
};
exports.updateCoursePricing = updateCoursePricing;
const deleteCourse = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_js_1.prisma.course.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        // Soft delete executed safely via Prisma middleware
        await prisma_js_1.prisma.course.delete({ where: { id } });
        // Audit Log
        await audit_service_js_1.auditService.log({
            action: 'COURSE_DELETED',
            entityType: 'COURSE',
            entityId: id,
            userId: req.user?.id,
            oldData: existing,
            metadata: { adminEmail: req.user?.email, adminName: req.user?.name },
        });
        res.json({ success: true, message: 'Course deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting course' });
    }
};
exports.deleteCourse = deleteCourse;
const togglePublishCourse = async (req, res) => {
    try {
        const id = req.params.id;
        const course = await prisma_js_1.prisma.course.findUnique({ where: { id } });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.course.update({
            where: { id },
            data: { isPublished: !course.isPublished },
        });
        res.json({
            success: true,
            message: `Course ${updated.isPublished ? 'published' : 'unpublished'} successfully`,
            course: updated,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating publish status' });
    }
};
exports.togglePublishCourse = togglePublishCourse;
// ============================================================================
// CATEGORY MANAGEMENT CONTROLLERS
// ============================================================================
const DEFAULT_CATEGORIES = [
    'Cloud Architecture',
    'AI & Data Science',
    'Software Engineering',
    'DevOps & Cloud',
    'Business Operations',
    'Cybersecurity',
];
const getCategories = async (_req, res) => {
    try {
        // 1. Get all categories from database
        let dbCategories = await prisma_js_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        // 2. If table is empty, seed defaults
        if (dbCategories.length === 0) {
            for (const name of DEFAULT_CATEGORIES) {
                const slug = generateSlug(name);
                await prisma_js_1.prisma.category.upsert({
                    where: { slug },
                    update: {},
                    create: { name, slug },
                });
            }
            dbCategories = await prisma_js_1.prisma.category.findMany({
                orderBy: { name: 'asc' },
            });
        }
        // 3. Count courses per category
        const courseCategories = await prisma_js_1.prisma.course.findMany({
            select: { category: true },
        });
        const counts = {};
        for (const c of courseCategories) {
            if (c.category) {
                const key = c.category.toLowerCase().trim();
                counts[key] = (counts[key] || 0) + 1;
            }
        }
        const categoriesWithCount = dbCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            courseCount: counts[cat.name.toLowerCase().trim()] || 0,
            createdAt: cat.createdAt,
        }));
        res.json({
            success: true,
            categories: categoriesWithCount,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching categories' });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            res.status(400).json({ success: false, message: 'Category name must be at least 2 characters' });
            return;
        }
        const trimmedName = name.trim();
        const slug = generateSlug(trimmedName);
        // Check if category with this name or slug already exists
        const existing = await prisma_js_1.prisma.category.findFirst({
            where: {
                OR: [
                    { name: { equals: trimmedName, mode: 'insensitive' } },
                    { slug: { equals: slug } },
                ],
            },
        });
        if (existing) {
            res.status(400).json({ success: false, message: `Category "${trimmedName}" already exists` });
            return;
        }
        const category = await prisma_js_1.prisma.category.create({
            data: {
                name: trimmedName,
                slug,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: {
                ...category,
                courseCount: 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error creating category' });
    }
};
exports.createCategory = createCategory;
const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await prisma_js_1.prisma.category.findFirst({
            where: {
                OR: [{ id }, { name: { equals: id, mode: 'insensitive' } }, { slug: id }],
            },
        });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        await prisma_js_1.prisma.category.delete({
            where: { id: category.id },
        });
        res.json({
            success: true,
            message: `Category "${category.name}" deleted successfully`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting category' });
    }
};
exports.deleteCategory = deleteCategory;
// ============================================================================
// COMING SOON INTEREST & UPCOMING COURSES HANDLERS
// ============================================================================
const registerCourseInterest = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to register interest' });
            return;
        }
        const id = req.params.id;
        const course = await prisma_js_1.prisma.course.findFirst({
            where: {
                OR: [{ id }, { slug: id }],
            },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        // Upsert interest registration (prevents duplicate registrations)
        await prisma_js_1.prisma.courseInterest.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId: course.id,
                },
            },
            create: {
                userId,
                courseId: course.id,
            },
            update: {},
        });
        const interestCount = await prisma_js_1.prisma.courseInterest.count({
            where: { courseId: course.id },
        });
        res.json({
            success: true,
            isInterested: true,
            interestCount,
            message: `You're on the priority list! We'll notify you the moment "${course.title}" launches.`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error registering interest' });
    }
};
exports.registerCourseInterest = registerCourseInterest;
const removeCourseInterest = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const id = req.params.id;
        const course = await prisma_js_1.prisma.course.findFirst({
            where: {
                OR: [{ id }, { slug: id }],
            },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        await prisma_js_1.prisma.courseInterest.deleteMany({
            where: {
                userId,
                courseId: course.id,
            },
        });
        const interestCount = await prisma_js_1.prisma.courseInterest.count({
            where: { courseId: course.id },
        });
        res.json({
            success: true,
            isInterested: false,
            interestCount,
            message: 'Notification alert removed.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error removing interest' });
    }
};
exports.removeCourseInterest = removeCourseInterest;
const getUpcomingCourses = async (_req, res) => {
    try {
        const courses = await prisma_js_1.prisma.course.findMany({
            where: {
                isPublished: true,
                isComingSoon: true,
            },
            orderBy: { launchDate: 'asc' },
            include: {
                _count: { select: { interests: true } },
                trainers: {
                    include: {
                        trainer: {
                            select: { id: true, name: true, avatar: true, title: true },
                        },
                    },
                },
            },
        });
        res.json({
            success: true,
            courses: courses.map((c) => ({
                id: c.id,
                title: c.title,
                slug: c.slug,
                description: c.description,
                comingSoonDescription: c.comingSoonDescription,
                thumbnail: c.thumbnail,
                category: c.category,
                instructor: c.instructor,
                level: c.level,
                isComingSoon: true,
                launchDate: c.launchDate,
                interestsCount: c._count.interests,
                trainers: c.trainers.map((t) => t.trainer),
            })),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching upcoming courses' });
    }
};
exports.getUpcomingCourses = getUpcomingCourses;
const uploadCourseThumbnail = async (req, res) => {
    try {
        const { imageBase64, fileName } = req.body;
        if (!imageBase64 || typeof imageBase64 !== 'string') {
            res.status(400).json({ success: false, message: 'No image data provided.' });
            return;
        }
        // Check payload size (max 5 MB)
        const base64Content = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const sizeInBytes = Math.round((base64Content.length * 3) / 4);
        const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
        if (sizeInBytes > MAX_SIZE) {
            res.status(400).json({
                success: false,
                message: 'File exceeds the 5 MB maximum upload limit.',
            });
            return;
        }
        // Parse MIME format
        let ext = 'jpg';
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,/);
        if (matches && matches[1]) {
            const mime = matches[1].toLowerCase();
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mime)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.',
                });
                return;
            }
            if (mime.includes('png'))
                ext = 'png';
            else if (mime.includes('webp'))
                ext = 'webp';
            else
                ext = 'jpg';
        }
        else if (fileName && typeof fileName === 'string') {
            const parsedExt = fileName.split('.').pop()?.toLowerCase();
            if (parsedExt && ['jpg', 'jpeg', 'png', 'webp'].includes(parsedExt)) {
                ext = parsedExt === 'jpeg' ? 'jpg' : parsedExt;
            }
        }
        const buffer = Buffer.from(base64Content, 'base64');
        // Create uploads directory if not existing
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'thumbnails');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeFileName = `course_thumb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = path_1.default.join(uploadsDir, safeFileName);
        fs_1.default.writeFileSync(filePath, buffer);
        const publicUrl = `/uploads/thumbnails/${safeFileName}`;
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        const absoluteUrl = `${protocol}://${host}${publicUrl}`;
        res.json({
            success: true,
            url: absoluteUrl,
            path: publicUrl,
            thumbnail: absoluteUrl,
            thumbnail_url: absoluteUrl,
            fileName: safeFileName,
            message: 'Course thumbnail uploaded successfully',
        });
    }
    catch (error) {
        console.error('Failed to upload course thumbnail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing uploaded thumbnail',
        });
    }
};
exports.uploadCourseThumbnail = uploadCourseThumbnail;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = exports.togglePublishCourse = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourseBySlug = exports.getAllCoursesAdmin = exports.getPublishedCourses = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const community_service_js_1 = require("../services/community.service.js");
const audit_service_js_1 = require("../services/audit.service.js");
const courseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    slug: zod_1.z.string().optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    thumbnail: zod_1.z.string().url('Invalid thumbnail URL').optional().or(zod_1.z.literal('')),
    price: zod_1.z.number().min(0, 'Price must be 0 or positive').default(0),
    instructor: zod_1.z.string().min(2, 'Instructor name is required'),
    category: zod_1.z.string().min(2, 'Category is required'),
    level: zod_1.z.string().optional().default('All Levels'),
    isPublished: zod_1.z.boolean().optional().default(false),
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
                _count: {
                    select: { enrollments: true },
                },
            },
        });
        const formatted = courses.map((course) => {
            const allLessons = course.modules.flatMap((m) => m.lessons);
            return {
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description,
                thumbnail: course.thumbnail,
                price: course.price,
                instructor: course.instructor,
                category: course.category,
                level: course.level,
                isPublished: course.isPublished,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                modulesCount: course.modules.length,
                lessonsCount: allLessons.length,
                quizzesCount: course.quizzes.length,
                studentsCount: course._count.enrollments,
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
                    include: {
                        lessons: true,
                    },
                },
                quizzes: true,
                _count: {
                    select: { enrollments: true },
                },
            },
        });
        const formatted = courses.map((course) => {
            const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            return {
                ...course,
                lessonsCount: totalLessons,
                quizzesCount: course.quizzes.length,
                studentsCount: course._count.enrollments,
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
                _count: {
                    select: { enrollments: true },
                },
            },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        let isEnrolled = false;
        let progressSummary = {
            completedLessonIds: [],
            completionPercentage: 0,
        };
        if (userId) {
            const enrollment = await prisma_js_1.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: course.id,
                    },
                },
            });
            if (enrollment || req.user?.role === 'ADMIN') {
                isEnrolled = true;
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
        res.json({
            success: true,
            course: {
                ...course,
                lessonsCount: totalLessons,
                studentsCount: course._count.enrollments,
                isEnrolled,
                userProgress: progressSummary,
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
        let slug = validatedData.slug || generateSlug(validatedData.title);
        const existing = await prisma_js_1.prisma.course.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const course = await prisma_js_1.prisma.course.create({
            data: {
                title: validatedData.title,
                slug,
                description: validatedData.description,
                thumbnail: validatedData.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
                price: validatedData.price,
                instructor: validatedData.instructor,
                category: validatedData.category,
                level: validatedData.level || 'All Levels',
                isPublished: validatedData.isPublished || false,
            },
        });
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
        res.status(201).json({ success: true, message: 'Course created successfully', course });
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
        const existing = await prisma_js_1.prisma.course.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.course.update({
            where: { id },
            data: validatedData,
        });
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
        res.json({ success: true, message: 'Course updated successfully', course: updated });
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

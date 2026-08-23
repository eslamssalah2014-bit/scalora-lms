"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainerDashboardStats = exports.toggleTrainerStatus = exports.updateTrainer = exports.createTrainer = exports.getTrainerById = exports.getAllTrainers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const audit_service_js_1 = require("../services/audit.service.js");
const trainerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional(),
    title: zod_1.z.string().optional(),
    bio: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional().or(zod_1.z.literal('')),
    linkedin: zod_1.z.string().optional().or(zod_1.z.literal('')),
    website: zod_1.z.string().optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
const getAllTrainers = async (req, res) => {
    try {
        const trainers = await prisma_js_1.prisma.user.findMany({
            where: {
                role: 'TRAINER',
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                title: true,
                bio: true,
                linkedin: true,
                website: true,
                status: true,
                createdAt: true,
                assignedCourses: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true,
                                _count: { select: { enrollments: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, trainers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching trainers' });
    }
};
exports.getAllTrainers = getAllTrainers;
const getTrainerById = async (req, res) => {
    try {
        const id = req.params.id;
        const trainer = await prisma_js_1.prisma.user.findFirst({
            where: { id, role: 'TRAINER', deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                title: true,
                bio: true,
                linkedin: true,
                website: true,
                status: true,
                createdAt: true,
                assignedCourses: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true,
                                _count: { select: { enrollments: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!trainer) {
            res.status(404).json({ success: false, message: 'Trainer not found' });
            return;
        }
        res.json({ success: true, trainer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching trainer' });
    }
};
exports.getTrainerById = getTrainerById;
const createTrainer = async (req, res) => {
    try {
        const validatedData = trainerSchema.parse(req.body);
        const existing = await prisma_js_1.prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() },
        });
        if (existing) {
            res.status(400).json({ success: false, message: 'A user with this email already exists' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(validatedData.password || 'ScaloraTrainer2026!', 10);
        const trainer = await prisma_js_1.prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email.toLowerCase(),
                password: passwordHash,
                role: 'TRAINER',
                title: validatedData.title || 'Senior Instructor',
                bio: validatedData.bio || '',
                avatar: validatedData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(validatedData.name)}&background=0284C7&color=fff`,
                linkedin: validatedData.linkedin || null,
                website: validatedData.website || null,
                status: validatedData.status || 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                title: true,
                bio: true,
                linkedin: true,
                website: true,
                status: true,
                createdAt: true,
            },
        });
        await audit_service_js_1.auditService.log({
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: trainer.id,
            userId: req.user?.id,
            newData: trainer,
            metadata: { role: 'TRAINER', createdBy: req.user?.email },
        });
        res.status(201).json({ success: true, message: 'Trainer account created successfully', trainer });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating trainer' });
    }
};
exports.createTrainer = createTrainer;
const updateTrainer = async (req, res) => {
    try {
        const id = req.params.id;
        const validatedData = trainerSchema.partial().parse(req.body);
        const existing = await prisma_js_1.prisma.user.findFirst({
            where: { id, role: 'TRAINER' },
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Trainer not found' });
            return;
        }
        const updatePayload = {
            name: validatedData.name,
            title: validatedData.title,
            bio: validatedData.bio,
            avatar: validatedData.avatar,
            linkedin: validatedData.linkedin,
            website: validatedData.website,
            status: validatedData.status,
        };
        if (validatedData.password && validatedData.password.trim()) {
            updatePayload.password = await bcryptjs_1.default.hash(validatedData.password, 10);
        }
        const updated = await prisma_js_1.prisma.user.update({
            where: { id },
            data: updatePayload,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                title: true,
                bio: true,
                linkedin: true,
                website: true,
                status: true,
                updatedAt: true,
            },
        });
        await audit_service_js_1.auditService.log({
            action: 'USER_UPDATED',
            entityType: 'USER',
            entityId: id,
            userId: req.user?.id,
            oldData: existing,
            newData: updated,
            metadata: { role: 'TRAINER' },
        });
        res.json({ success: true, message: 'Trainer profile updated successfully', trainer: updated });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error updating trainer' });
    }
};
exports.updateTrainer = updateTrainer;
const toggleTrainerStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const trainer = await prisma_js_1.prisma.user.findFirst({
            where: { id, role: 'TRAINER' },
        });
        if (!trainer) {
            res.status(404).json({ success: false, message: 'Trainer not found' });
            return;
        }
        const newStatus = trainer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const updated = await prisma_js_1.prisma.user.update({
            where: { id },
            data: { status: newStatus },
            select: { id: true, name: true, email: true, status: true },
        });
        res.json({ success: true, message: `Trainer status updated to ${newStatus}`, trainer: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating status' });
    }
};
exports.toggleTrainerStatus = toggleTrainerStatus;
const getTrainerDashboardStats = async (req, res) => {
    try {
        const trainerId = req.user?.id;
        if (!trainerId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        // 1. Get assigned courses
        const assignedCourses = await prisma_js_1.prisma.courseTrainer.findMany({
            where: { trainerId },
            include: {
                course: {
                    include: {
                        modules: { include: { lessons: true } },
                        enrollments: {
                            where: { status: 'ACTIVE' },
                            include: {
                                user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
                            },
                        },
                        communityChannel: {
                            select: { id: true, name: true, _count: { select: { posts: true, members: true } } },
                        },
                    },
                },
            },
        });
        const courses = assignedCourses.map((ac) => ac.course);
        const totalStudents = new Set(courses.flatMap((c) => c.enrollments.map((e) => e.userId))).size;
        const totalLessons = courses.reduce((sum, c) => sum + c.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0);
        // 2. Get unread direct messages count
        const unreadMessagesCount = await prisma_js_1.prisma.directMessage.count({
            where: {
                recipientId: trainerId,
                isRead: false,
                deletedAt: null,
            },
        });
        res.json({
            success: true,
            stats: {
                totalAssignedCourses: courses.length,
                totalEnrolledStudents: totalStudents,
                totalLessons,
                unreadMessagesCount,
            },
            courses: courses.map((c) => ({
                id: c.id,
                title: c.title,
                slug: c.slug,
                thumbnail: c.thumbnail,
                category: c.category,
                isPublished: c.isPublished,
                studentsCount: c.enrollments.length,
                lessonsCount: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
                communityChannelId: c.communityChannel?.id,
                students: c.enrollments.map((e) => e.user),
            })),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error loading dashboard' });
    }
};
exports.getTrainerDashboardStats = getTrainerDashboardStats;

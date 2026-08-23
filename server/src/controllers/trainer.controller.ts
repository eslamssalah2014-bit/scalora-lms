import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { auditService } from '../services/audit.service.js';

const trainerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional().or(z.literal('')),
  linkedin: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const getAllTrainers = async (req: Request, res: Response): Promise<void> => {
  try {
    const trainers = await prisma.user.findMany({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching trainers' });
  }
};

export const getTrainerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const trainer = await prisma.user.findFirst({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching trainer' });
  }
};

export const createTrainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = trainerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(validatedData.password || 'ScaloraTrainer2026!', 10);

    const trainer = await prisma.user.create({
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

    await auditService.log({
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: trainer.id,
      userId: req.user?.id,
      newData: trainer,
      metadata: { role: 'TRAINER', createdBy: req.user?.email },
    });

    res.status(201).json({ success: true, message: 'Trainer account created successfully', trainer });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating trainer' });
  }
};

export const updateTrainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const validatedData = trainerSchema.partial().parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { id, role: 'TRAINER' },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    const updatePayload: any = {
      name: validatedData.name,
      title: validatedData.title,
      bio: validatedData.bio,
      avatar: validatedData.avatar,
      linkedin: validatedData.linkedin,
      website: validatedData.website,
      status: validatedData.status,
    };

    if (validatedData.password && validatedData.password.trim()) {
      updatePayload.password = await bcrypt.hash(validatedData.password, 10);
    }

    const updated = await prisma.user.update({
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

    await auditService.log({
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      userId: req.user?.id,
      oldData: existing,
      newData: updated,
      metadata: { role: 'TRAINER' },
    });

    res.json({ success: true, message: 'Trainer profile updated successfully', trainer: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error updating trainer' });
  }
};

export const toggleTrainerStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const trainer = await prisma.user.findFirst({
      where: { id, role: 'TRAINER' },
    });

    if (!trainer) {
      res.status(404).json({ success: false, message: 'Trainer not found' });
      return;
    }

    const newStatus = trainer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, status: true },
    });

    res.json({ success: true, message: `Trainer status updated to ${newStatus}`, trainer: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating status' });
  }
};

export const getTrainerDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // 1. Get assigned courses
    const assignedCourses = await prisma.courseTrainer.findMany({
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
    const unreadMessagesCount = await prisma.directMessage.count({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error loading dashboard' });
  }
};

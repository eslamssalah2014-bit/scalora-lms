import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const lessonSchema = z.object({
  title: z.string().min(2, 'Lesson title must be at least 2 characters'),
  type: z.enum(['YOUTUBE', 'PDF', 'DOWNLOAD', 'TEXT']),
  content: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  order: z.number().optional().default(0),
  moduleId: z.string().min(1, 'Module ID is required'),
});

export const getLessonById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const lesson = await prisma.lesson.findUnique({
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
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId!,
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
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: id,
          },
        },
      });
      isCompleted = progress?.isCompleted ?? false;
    }

    res.json({
      success: true,
      lesson: {
        ...lesson,
        isCompleted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching lesson' });
  }
};

export const createLesson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = lessonSchema.parse(req.body);

    const moduleItem = await prisma.module.findUnique({ where: { id: validatedData.moduleId } });
    if (!moduleItem) {
      res.status(404).json({ success: false, message: 'Module not found' });
      return;
    }

    let order = validatedData.order;
    if (order === 0) {
      const highestLesson = await prisma.lesson.findFirst({
        where: { moduleId: validatedData.moduleId },
        orderBy: { order: 'desc' },
      });
      order = (highestLesson?.order ?? -1) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        content: validatedData.content || null,
        videoUrl: validatedData.videoUrl || null,
        fileUrl: validatedData.fileUrl || null,
        fileName: validatedData.fileName || null,
        fileSize: validatedData.fileSize || null,
        duration: validatedData.duration || null,
        order,
        moduleId: validatedData.moduleId,
      },
    });

    res.status(201).json({ success: true, message: 'Lesson created successfully', lesson });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating lesson' });
  }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const validatedData = lessonSchema.partial().parse(req.body);

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: validatedData,
    });

    res.json({ success: true, message: 'Lesson updated successfully', lesson: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error updating lesson' });
  }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    await prisma.lesson.delete({ where: { id } });

    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting lesson' });
  }
};

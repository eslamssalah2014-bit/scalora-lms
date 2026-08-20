import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const moduleSchema = z.object({
  title: z.string().min(2, 'Module title must be at least 2 characters'),
  order: z.number().optional().default(0),
  courseId: z.string().min(1, 'Course ID is required'),
});

export const createModule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = moduleSchema.parse(req.body);

    const course = await prisma.course.findUnique({ where: { id: validatedData.courseId } });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    let order = validatedData.order;
    if (order === 0) {
      const highestModule = await prisma.module.findFirst({
        where: { courseId: validatedData.courseId },
        orderBy: { order: 'desc' },
      });
      order = (highestModule?.order ?? -1) + 1;
    }

    const moduleItem = await prisma.module.create({
      data: {
        title: validatedData.title,
        order,
        courseId: validatedData.courseId,
      },
      include: {
        lessons: true,
      },
    });

    res.status(201).json({ success: true, message: 'Module created successfully', module: moduleItem });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating module' });
  }
};

export const updateModule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, order } = req.body;

    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Module not found' });
      return;
    }

    const updated = await prisma.module.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(order !== undefined && { order }),
      },
      include: {
        lessons: true,
      },
    });

    res.json({ success: true, message: 'Module updated successfully', module: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating module' });
  }
};

export const deleteModule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.module.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Module not found' });
      return;
    }

    await prisma.module.delete({ where: { id } });

    res.json({ success: true, message: 'Module deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting module' });
  }
};

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { notificationService } from '../services/notification.service.js';

const broadcastSchema = z.object({
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  targetType: z.enum(['ALL', 'COURSE']),
  courseId: z.string().optional(),
  type: z.string().optional(),
});

/**
 * Get current user's notifications with rich category filtering & unread metrics
 */
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { tab = 'ALL', page = '1', limit = '30', search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };

    // Tab Filtering
    const normalizedTab = String(tab).toUpperCase();
    if (normalizedTab === 'UNREAD') {
      where.isRead = false;
    } else if (normalizedTab === 'MESSAGES') {
      where.type = { in: ['MESSAGE', 'DIRECT_MESSAGE'] };
    } else if (normalizedTab === 'COMMUNITY') {
      where.type = { in: ['COMMENT', 'REPLY', 'LIKE', 'MENTION', 'CHAT', 'CHAT_MENTION', 'WELCOME'] };
    } else if (normalizedTab === 'COURSES') {
      where.type = { in: ['COURSE_LESSON', 'COURSE_MODULE', 'COURSE_ANNOUNCEMENT', 'COURSE_RESOURCE', 'ANNOUNCEMENT'] };
    } else if (normalizedTab === 'SYSTEM') {
      where.type = { in: ['SYSTEM', 'GLOBAL', 'ENROLLMENT', 'PAYMENT', 'SECURITY'] };
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.message = { contains: search.trim(), mode: 'insensitive' };
    }

    const [notifications, totalCount, totalUnread, unreadMessages, unreadCommunity, unreadCourses, unreadSystem] =
      await Promise.all([
        prisma.communityNotification.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, name: true, avatar: true, role: true, title: true },
            },
            channel: {
              select: { id: true, name: true, courseId: true },
            },
          },
        }),
        prisma.communityNotification.count({ where }),
        prisma.communityNotification.count({ where: { userId, isRead: false } }),
        prisma.communityNotification.count({
          where: { userId, isRead: false, type: { in: ['MESSAGE', 'DIRECT_MESSAGE'] } },
        }),
        prisma.communityNotification.count({
          where: {
            userId,
            isRead: false,
            type: { in: ['COMMENT', 'REPLY', 'LIKE', 'MENTION', 'CHAT', 'CHAT_MENTION', 'WELCOME'] },
          },
        }),
        prisma.communityNotification.count({
          where: {
            userId,
            isRead: false,
            type: { in: ['COURSE_LESSON', 'COURSE_MODULE', 'COURSE_ANNOUNCEMENT', 'COURSE_RESOURCE', 'ANNOUNCEMENT'] },
          },
        }),
        prisma.communityNotification.count({
          where: {
            userId,
            isRead: false,
            type: { in: ['SYSTEM', 'GLOBAL', 'ENROLLMENT', 'PAYMENT', 'SECURITY'] },
          },
        }),
      ]);

    res.json({
      success: true,
      unreadCount: totalUnread,
      unreadCounts: {
        all: totalUnread,
        messages: unreadMessages,
        community: unreadCommunity,
        courses: unreadCourses,
        system: unreadSystem,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        channelId: n.channelId,
        channelName: n.channel?.name,
        postId: n.postId,
        actor: n.actor,
        createdAt: n.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching notifications' });
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    await prisma.communityNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating notification' });
  }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await prisma.communityNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error marking all read' });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    await prisma.communityNotification.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Notification removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error removing notification' });
  }
};

/**
 * Admin: Broadcast a notification (Global to all users or specific course)
 */
export const adminBroadcastNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actorId = req.user?.id;
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin role required' });
      return;
    }

    const { title, message, targetType, courseId, type } = broadcastSchema.parse(req.body);

    const result = await notificationService.broadcastNotification({
      actorId,
      title,
      message,
      targetType,
      courseId,
      type: type || (targetType === 'COURSE' ? 'COURSE_ANNOUNCEMENT' : 'GLOBAL'),
    });

    res.status(201).json({
      success: true,
      message: `Notification broadcast successfully to ${result.count} scholars`,
      count: result.count,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error broadcasting notification' });
  }
};

/**
 * Admin: Get available courses for broadcast target selection
 */
export const adminGetBroadcastCourses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin role required' });
      return;
    }

    const courses = await prisma.course.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { title: 'asc' },
    });

    res.json({
      success: true,
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        enrolledCount: c._count.enrollments,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching broadcast courses' });
  }
};

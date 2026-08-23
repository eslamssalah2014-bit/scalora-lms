import { prisma } from '../lib/prisma.js';
import { realtimeService } from './realtime.service.js';

export interface CreateNotificationParams {
  userId: string;
  actorId?: string | null;
  channelId?: string | null;
  postId?: string | null;
  type: string;
  message: string;
}

export interface BroadcastNotificationParams {
  actorId?: string | null;
  title: string;
  message: string;
  targetType: 'ALL' | 'COURSE';
  courseId?: string;
  type?: string;
}

class NotificationService {
  /**
   * Create and deliver a real-time notification to a specific user
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      if (params.actorId && params.userId === params.actorId) {
        return null; // Avoid self-notifications
      }

      const notif = await prisma.communityNotification.create({
        data: {
          userId: params.userId,
          actorId: params.actorId || null,
          channelId: params.channelId || null,
          postId: params.postId || null,
          type: params.type,
          message: params.message,
          isRead: false,
        },
        include: {
          actor: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          channel: {
            select: { id: true, name: true },
          },
        },
      });

      // Deliver via Realtime SSE Stream instantly
      realtimeService.sendToUser(params.userId, 'notification', {
        notification: {
          id: notif.id,
          type: notif.type,
          message: notif.message,
          isRead: notif.isRead,
          channelId: notif.channelId,
          channelName: notif.channel?.name,
          postId: notif.postId,
          actor: notif.actor,
          createdAt: notif.createdAt,
        },
      });

      return notif;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      return null;
    }
  }

  /**
   * Broadcast a notification to all users or enrolled students of a specific course
   */
  async broadcastNotification(params: BroadcastNotificationParams) {
    try {
      let recipientUserIds: string[] = [];
      let channelId: string | null = null;

      if (params.targetType === 'COURSE' && params.courseId) {
        // Find enrolled active students for this course
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: params.courseId, status: 'ACTIVE', deletedAt: null },
          select: { userId: true },
        });

        recipientUserIds = enrollments
          .map((e) => e.userId)
          .filter((uid) => uid !== params.actorId);

        // Find associated channel if any
        const channel = await prisma.communityChannel.findUnique({
          where: { courseId: params.courseId },
          select: { id: true },
        });
        if (channel) {
          channelId = channel.id;
        }
      } else {
        // Broadcast to all active users
        const allUsers = await prisma.user.findMany({
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        });

        recipientUserIds = allUsers
          .map((u) => u.id)
          .filter((uid) => uid !== params.actorId);
      }

      if (recipientUserIds.length === 0) {
        return { count: 0, recipientUserIds: [] };
      }

      const notifType = params.type || (params.targetType === 'COURSE' ? 'COURSE_ANNOUNCEMENT' : 'GLOBAL');
      const formattedMessage = params.title
        ? `[${params.title}]: ${params.message}`
        : params.message;

      // Batch create notifications in database
      await prisma.communityNotification.createMany({
        data: recipientUserIds.map((userId) => ({
          userId,
          actorId: params.actorId || null,
          channelId,
          type: notifType,
          message: formattedMessage,
          isRead: false,
        })),
      });

      // Broadcast real-time SSE push to all recipients
      const payload = {
        notification: {
          type: notifType,
          message: formattedMessage,
          isRead: false,
          channelId,
          createdAt: new Date().toISOString(),
        },
      };

      if (params.targetType === 'ALL') {
        realtimeService.broadcastToAll('notification', payload);
      } else {
        recipientUserIds.forEach((uid) => {
          realtimeService.sendToUser(uid, 'notification', payload);
        });
      }

      return { count: recipientUserIds.length, recipientUserIds };
    } catch (error) {
      console.error('[NotificationService] Error broadcasting notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

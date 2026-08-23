"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const realtime_service_js_1 = require("./realtime.service.js");
const webpush_service_js_1 = require("./webpush.service.js");
class NotificationService {
    broadcastHistory = [];
    /**
     * Create and deliver a real-time notification to a specific user
     */
    async createNotification(params) {
        try {
            if (params.actorId && params.userId === params.actorId) {
                return null; // Avoid self-notifications
            }
            const notif = await prisma_js_1.prisma.communityNotification.create({
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
            // 1. Deliver via Realtime SSE Stream instantly
            realtime_service_js_1.realtimeService.sendToUser(params.userId, 'notification', {
                notification: {
                    id: notif.id,
                    type: notif.type,
                    message: notif.message,
                    imageUrl: params.imageUrl || null,
                    actionUrl: params.actionUrl || null,
                    isRead: notif.isRead,
                    channelId: notif.channelId,
                    channelName: notif.channel?.name,
                    postId: notif.postId,
                    actor: notif.actor,
                    createdAt: notif.createdAt,
                },
            });
            // 2. Deliver via Native OS Web Push (Android System Tray / Desktop Push)
            webpush_service_js_1.webPushService
                .sendPushToUser(params.userId, {
                title: 'Scalora LMS',
                body: params.message,
                image: params.imageUrl || undefined,
                url: params.actionUrl || '/notifications',
                type: params.type,
            })
                .catch((err) => console.error('[NotificationService] Web Push delivery error:', err));
            return notif;
        }
        catch (error) {
            console.error('[NotificationService] Error creating notification:', error);
            return null;
        }
    }
    /**
     * Broadcast a notification to all users, a specific course, or a specific trainer's students
     */
    async broadcastNotification(params) {
        try {
            let recipientUserIds = [];
            let channelId = null;
            let targetName = 'All Platform Scholars';
            if (params.targetType === 'COURSE' && params.courseId) {
                // Find course details
                const course = await prisma_js_1.prisma.course.findUnique({
                    where: { id: params.courseId },
                    select: { id: true, title: true },
                });
                targetName = course ? course.title : 'Selected Course Track';
                // Find enrolled active students for this course
                const enrollments = await prisma_js_1.prisma.enrollment.findMany({
                    where: { courseId: params.courseId, status: 'ACTIVE', deletedAt: null },
                    select: { userId: true },
                });
                recipientUserIds = Array.from(new Set(enrollments
                    .map((e) => e.userId)
                    .filter((uid) => uid !== params.actorId)));
                // Find associated channel if any
                const channel = await prisma_js_1.prisma.communityChannel.findUnique({
                    where: { courseId: params.courseId },
                    select: { id: true },
                });
                if (channel) {
                    channelId = channel.id;
                }
            }
            else if (params.targetType === 'TRAINER' && params.trainerId) {
                // Find trainer details
                const trainer = await prisma_js_1.prisma.user.findUnique({
                    where: { id: params.trainerId },
                    select: { id: true, name: true },
                });
                targetName = trainer ? `Students of ${trainer.name}` : 'Trainer Students';
                // Find courses assigned to this trainer
                const assignedCourses = await prisma_js_1.prisma.courseTrainer.findMany({
                    where: { trainerId: params.trainerId },
                    select: { courseId: true },
                });
                const courseIds = assignedCourses.map((c) => c.courseId);
                if (courseIds.length > 0) {
                    const enrollments = await prisma_js_1.prisma.enrollment.findMany({
                        where: { courseId: { in: courseIds }, status: 'ACTIVE', deletedAt: null },
                        select: { userId: true },
                    });
                    recipientUserIds = Array.from(new Set(enrollments
                        .map((e) => e.userId)
                        .filter((uid) => uid !== params.actorId)));
                }
            }
            else {
                // Broadcast to all active users
                const allUsers = await prisma_js_1.prisma.user.findMany({
                    where: { status: 'ACTIVE', deletedAt: null },
                    select: { id: true },
                });
                recipientUserIds = allUsers
                    .map((u) => u.id)
                    .filter((uid) => uid !== params.actorId);
            }
            if (recipientUserIds.length === 0) {
                return { count: 0, recipientUserIds: [], broadcastId: null };
            }
            const notifType = params.type ||
                (params.targetType === 'COURSE'
                    ? 'COURSE_ANNOUNCEMENT'
                    : params.targetType === 'TRAINER'
                        ? 'TRAINER_ANNOUNCEMENT'
                        : 'GLOBAL');
            const formattedMessage = params.title
                ? `[${params.title}]: ${params.message}`
                : params.message;
            // Batch create notifications in database
            await prisma_js_1.prisma.communityNotification.createMany({
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
                    title: params.title,
                    message: formattedMessage,
                    imageUrl: params.imageUrl || null,
                    actionUrl: params.actionUrl || null,
                    isRead: false,
                    channelId,
                    createdAt: new Date().toISOString(),
                },
            };
            // 1. In-app SSE Realtime Push
            if (params.targetType === 'ALL') {
                realtime_service_js_1.realtimeService.broadcastToAll('notification', payload);
            }
            else {
                recipientUserIds.forEach((uid) => {
                    realtime_service_js_1.realtimeService.sendToUser(uid, 'notification', payload);
                });
            }
            // 2. Native OS Web Push (Android System Tray + Desktop Push)
            const pushPayload = {
                title: params.title,
                body: params.message,
                image: params.imageUrl || undefined,
                url: params.actionUrl || '/notifications',
                type: notifType,
            };
            if (params.targetType === 'ALL') {
                webpush_service_js_1.webPushService.sendPushToAll(pushPayload).catch((err) => {
                    console.error('[NotificationService] Global Web Push broadcast error:', err);
                });
            }
            else {
                webpush_service_js_1.webPushService.sendPushToUsers(recipientUserIds, pushPayload).catch((err) => {
                    console.error('[NotificationService] Targeted Web Push error:', err);
                });
            }
            // Record in broadcast history
            const broadcastRecord = {
                id: `bc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                title: params.title,
                message: params.message,
                type: notifType,
                targetType: params.targetType,
                targetId: params.courseId || params.trainerId || null,
                targetName,
                imageUrl: params.imageUrl || null,
                actionUrl: params.actionUrl || null,
                sentBy: params.actorName || 'Administrator',
                sentAt: new Date().toISOString(),
                deliveredCount: recipientUserIds.length,
                readCount: 0,
                readRate: 0,
                recipientUserIds,
            };
            this.broadcastHistory.unshift(broadcastRecord);
            if (this.broadcastHistory.length > 50) {
                this.broadcastHistory.pop();
            }
            return {
                count: recipientUserIds.length,
                recipientUserIds,
                broadcastId: broadcastRecord.id,
                broadcast: broadcastRecord,
            };
        }
        catch (error) {
            console.error('[NotificationService] Error broadcasting notification:', error);
            throw error;
        }
    }
    /**
     * Get broadcast history with live read metrics from database
     */
    async getBroadcastHistory() {
        try {
            const formattedHistory = await Promise.all(this.broadcastHistory.map(async (record) => {
                if (record.recipientUserIds.length === 0)
                    return record;
                // Compute live read count from database
                const readCount = await prisma_js_1.prisma.communityNotification.count({
                    where: {
                        userId: { in: record.recipientUserIds },
                        message: { startsWith: `[${record.title}]` },
                        isRead: true,
                    },
                });
                const readRate = record.deliveredCount > 0
                    ? Math.round((readCount / record.deliveredCount) * 100)
                    : 0;
                return {
                    ...record,
                    readCount,
                    readRate,
                };
            }));
            return formattedHistory;
        }
        catch (error) {
            console.error('[NotificationService] Error calculating broadcast history metrics:', error);
            return this.broadcastHistory;
        }
    }
}
exports.notificationService = new NotificationService();

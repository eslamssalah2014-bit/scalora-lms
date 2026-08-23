"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestPushNotification = exports.registerPushSubscription = exports.getVapidPublicKey = exports.adminGetBroadcastAudience = exports.adminGetBroadcastHistory = exports.adminBroadcastNotification = exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getMyNotifications = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const notification_service_js_1 = require("../services/notification.service.js");
const webpush_service_js_1 = require("../services/webpush.service.js");
/**
 * Get current user's notifications with rich category filtering & unread metrics
 */
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { tab = 'ALL', page = '1', limit = '30', search } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 30));
        const skip = (pageNum - 1) * limitNum;
        const where = { userId };
        // Tab Filtering
        const normalizedTab = String(tab).toUpperCase();
        if (normalizedTab === 'UNREAD') {
            where.isRead = false;
        }
        else if (normalizedTab === 'MESSAGES') {
            where.type = { in: ['MESSAGE', 'DIRECT_MESSAGE'] };
        }
        else if (normalizedTab === 'COMMUNITY') {
            where.type = { in: ['COMMENT', 'REPLY', 'LIKE', 'MENTION', 'CHAT', 'CHAT_MENTION', 'WELCOME'] };
        }
        else if (normalizedTab === 'COURSES') {
            where.type = { in: ['COURSE_LESSON', 'COURSE_MODULE', 'COURSE_ANNOUNCEMENT', 'COURSE_RESOURCE', 'ANNOUNCEMENT'] };
        }
        else if (normalizedTab === 'SYSTEM') {
            where.type = { in: ['SYSTEM', 'GLOBAL', 'ENROLLMENT', 'PAYMENT', 'SECURITY'] };
        }
        if (search && typeof search === 'string' && search.trim()) {
            where.message = { contains: search.trim(), mode: 'insensitive' };
        }
        const [notifications, totalCount, totalUnread, unreadMessages, unreadCommunity, unreadCourses, unreadSystem] = await Promise.all([
            prisma_js_1.prisma.communityNotification.findMany({
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
            prisma_js_1.prisma.communityNotification.count({ where }),
            prisma_js_1.prisma.communityNotification.count({ where: { userId, isRead: false } }),
            prisma_js_1.prisma.communityNotification.count({
                where: { userId, isRead: false, type: { in: ['MESSAGE', 'DIRECT_MESSAGE'] } },
            }),
            prisma_js_1.prisma.communityNotification.count({
                where: {
                    userId,
                    isRead: false,
                    type: { in: ['COMMENT', 'REPLY', 'LIKE', 'MENTION', 'CHAT', 'CHAT_MENTION', 'WELCOME'] },
                },
            }),
            prisma_js_1.prisma.communityNotification.count({
                where: {
                    userId,
                    isRead: false,
                    type: { in: ['COURSE_LESSON', 'COURSE_MODULE', 'COURSE_ANNOUNCEMENT', 'COURSE_RESOURCE', 'ANNOUNCEMENT'] },
                },
            }),
            prisma_js_1.prisma.communityNotification.count({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching notifications' });
    }
};
exports.getMyNotifications = getMyNotifications;
/**
 * Mark a single notification as read
 */
const markNotificationRead = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        await prisma_js_1.prisma.communityNotification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error updating notification' });
    }
};
exports.markNotificationRead = markNotificationRead;
/**
 * Mark all notifications as read for current user
 */
const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        await prisma_js_1.prisma.communityNotification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error marking all read' });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        await prisma_js_1.prisma.communityNotification.deleteMany({
            where: { id, userId },
        });
        res.json({ success: true, message: 'Notification removed' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error removing notification' });
    }
};
exports.deleteNotification = deleteNotification;
const broadcastSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Notification title is required'),
    message: zod_1.z.string().min(1, 'Notification message is required'),
    targetType: zod_1.z.enum(['ALL', 'COURSE', 'TRAINER']),
    courseId: zod_1.z.string().optional(),
    trainerId: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    actionUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
/**
 * Admin: Broadcast a notification (Global, Course-specific, or Trainer-specific)
 */
const adminBroadcastNotification = async (req, res) => {
    try {
        const actorId = req.user?.id;
        const actorName = req.user?.name || 'Administrator';
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Admin role required' });
            return;
        }
        const validated = broadcastSchema.parse(req.body);
        const result = await notification_service_js_1.notificationService.broadcastNotification({
            actorId,
            actorName,
            title: validated.title,
            message: validated.message,
            targetType: validated.targetType,
            courseId: validated.courseId,
            trainerId: validated.trainerId,
            type: validated.type,
            imageUrl: validated.imageUrl,
            actionUrl: validated.actionUrl,
        });
        res.status(201).json({
            success: true,
            message: `Notification broadcast successfully to ${result.count} scholars`,
            count: result.count,
            broadcast: result.broadcast,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error broadcasting notification' });
    }
};
exports.adminBroadcastNotification = adminBroadcastNotification;
/**
 * Admin: Get broadcast campaign history with live analytics metrics
 */
const adminGetBroadcastHistory = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Admin role required' });
            return;
        }
        const history = await notification_service_js_1.notificationService.getBroadcastHistory();
        res.json({
            success: true,
            history,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching broadcast history' });
    }
};
exports.adminGetBroadcastHistory = adminGetBroadcastHistory;
/**
 * Admin: Get available audience targets (courses and trainers with student counts)
 */
const adminGetBroadcastAudience = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Admin role required' });
            return;
        }
        const [courses, trainers] = await Promise.all([
            prisma_js_1.prisma.course.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    category: true,
                    _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
                },
                orderBy: { title: 'asc' },
            }),
            prisma_js_1.prisma.user.findMany({
                where: { role: 'TRAINER', deletedAt: null, status: 'ACTIVE' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    title: true,
                    assignedCourses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
                                },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            }),
        ]);
        const formattedTrainers = trainers.map((t) => {
            const studentCount = t.assignedCourses.reduce((sum, ac) => sum + (ac.course._count.enrollments || 0), 0);
            return {
                id: t.id,
                name: t.name,
                email: t.email,
                avatar: t.avatar,
                title: t.title,
                coursesCount: t.assignedCourses.length,
                studentCount,
            };
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
            trainers: formattedTrainers,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching audience options' });
    }
};
exports.adminGetBroadcastAudience = adminGetBroadcastAudience;
/**
 * Public/Auth: Get server VAPID Public Key for client PushSubscription
 */
const getVapidPublicKey = async (_req, res) => {
    res.json({
        success: true,
        publicKey: webpush_service_js_1.VAPID_PUBLIC_KEY,
    });
};
exports.getVapidPublicKey = getVapidPublicKey;
/**
 * Auth: Register client Web Push subscription
 */
const registerPushSubscription = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { subscription, userAgent } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            res.status(400).json({ success: false, message: 'Valid push subscription object is required' });
            return;
        }
        const record = webpush_service_js_1.webPushService.saveSubscription(userId, subscription, userAgent);
        res.json({
            success: true,
            message: 'Native Push Subscription registered successfully',
            subscriptionId: record.id,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error registering push subscription' });
    }
};
exports.registerPushSubscription = registerPushSubscription;
/**
 * Auth: Send a test Native Push Notification directly to the requesting user's device
 */
const sendTestPushNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const result = await webpush_service_js_1.webPushService.sendPushToUser(userId, {
            title: 'Scalora • Test OS Push Notification',
            body: 'Operating system push notifications are active and working on your device! 🔔',
            url: '/notifications',
            type: 'SYSTEM',
        });
        res.json({
            success: true,
            message: `Test Push sent to ${result.success} active device endpoints (Failed: ${result.failed})`,
            result,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error sending test push notification' });
    }
};
exports.sendTestPushNotification = sendTestPushNotification;

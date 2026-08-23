"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityService = exports.CommunityService = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const notification_service_js_1 = require("./notification.service.js");
const realtime_service_js_1 = require("./realtime.service.js");
class CommunityService {
    /**
     * Ensures that every course has a dedicated Community Channel.
     */
    async ensureCourseChannel(courseId, title, description) {
        let channel = await prisma_js_1.prisma.communityChannel.findUnique({
            where: { courseId },
        });
        if (!channel) {
            const course = await prisma_js_1.prisma.course.findUnique({ where: { id: courseId } });
            const channelTitle = title || course?.title || 'Course Community';
            const channelDesc = description ||
                course?.description ||
                `Official private community and discussion channel for ${channelTitle}. Connect with peers and instructors.`;
            channel = await prisma_js_1.prisma.communityChannel.create({
                data: {
                    courseId,
                    name: `${channelTitle} Community`,
                    description: channelDesc,
                    isLocked: false,
                    isArchived: false,
                },
            });
        }
        return channel;
    }
    /**
     * Automatically enrolls a student into the corresponding course community channel.
     */
    async autoEnrollInChannel(userId, courseId, role = 'MEMBER') {
        try {
            const channel = await this.ensureCourseChannel(courseId);
            const existingMember = await prisma_js_1.prisma.communityMember.findUnique({
                where: {
                    channelId_userId: {
                        channelId: channel.id,
                        userId,
                    },
                },
            });
            if (!existingMember) {
                const member = await prisma_js_1.prisma.communityMember.create({
                    data: {
                        channelId: channel.id,
                        userId,
                        role,
                    },
                });
                // Send welcome notification to user
                await this.createNotification({
                    userId,
                    channelId: channel.id,
                    type: 'WELCOME',
                    message: `Welcome to the ${channel.name}! You now have full access to share posts, discuss curriculum, and collaborate with peers.`,
                });
                return member;
            }
            return existingMember;
        }
        catch (error) {
            console.error(`[CommunityService] Failed to auto-enroll user ${userId} in course ${courseId}:`, error);
            return null;
        }
    }
    /**
     * Dispatches a notification to a specific user (avoids self-notifications).
     */
    async createNotification(params) {
        return notification_service_js_1.notificationService.createNotification(params);
    }
    /**
     * Broadcasts an announcement notification to all members of a channel (or all channels).
     */
    async broadcastChannelAnnouncement(params) {
        try {
            const channel = await prisma_js_1.prisma.communityChannel.findUnique({
                where: { id: params.channelId },
                include: {
                    members: {
                        select: { userId: true },
                    },
                },
            });
            if (!channel)
                return;
            const recipientIds = channel.members
                .map((m) => m.userId)
                .filter((uid) => uid !== params.actorId);
            const messageText = `📢 Important Announcement in ${channel.name}: "${params.announcementTitle}"`;
            const notificationsData = recipientIds.map((userId) => ({
                userId,
                actorId: params.actorId,
                channelId: params.channelId,
                postId: params.postId,
                type: 'ANNOUNCEMENT',
                message: messageText,
                isRead: false,
            }));
            if (notificationsData.length > 0) {
                await prisma_js_1.prisma.communityNotification.createMany({
                    data: notificationsData,
                });
                // Real-time SSE push to all recipients
                recipientIds.forEach((uid) => {
                    realtime_service_js_1.realtimeService.sendToUser(uid, 'notification', {
                        notification: {
                            type: 'ANNOUNCEMENT',
                            message: messageText,
                            channelId: params.channelId,
                            postId: params.postId,
                            isRead: false,
                            createdAt: new Date().toISOString(),
                        },
                    });
                });
            }
        }
        catch (error) {
            console.error('[CommunityService] Error broadcasting announcement:', error);
        }
    }
    /**
     * Self-healing sync: ensures all existing courses have community channels,
     * and all active enrollments have community channel memberships.
     */
    async syncAllChannelsAndMembers() {
        try {
            // 1. Fetch all courses
            const courses = await prisma_js_1.prisma.course.findMany({
                select: { id: true, title: true, description: true },
            });
            let channelsCreated = 0;
            for (const course of courses) {
                const existing = await prisma_js_1.prisma.communityChannel.findUnique({
                    where: { courseId: course.id },
                });
                if (!existing) {
                    await prisma_js_1.prisma.communityChannel.create({
                        data: {
                            courseId: course.id,
                            name: `${course.title} Community`,
                            description: `Official peer discussion and instructor channel for ${course.title}.`,
                        },
                    });
                    channelsCreated++;
                }
            }
            // 2. Fetch all active enrollments
            const enrollments = await prisma_js_1.prisma.enrollment.findMany({
                where: { status: 'ACTIVE' },
                select: { userId: true, courseId: true },
            });
            let membershipsAdded = 0;
            for (const enr of enrollments) {
                const channel = await prisma_js_1.prisma.communityChannel.findUnique({
                    where: { courseId: enr.courseId },
                });
                if (channel) {
                    const existingMem = await prisma_js_1.prisma.communityMember.findUnique({
                        where: {
                            channelId_userId: {
                                channelId: channel.id,
                                userId: enr.userId,
                            },
                        },
                    });
                    if (!existingMem) {
                        await prisma_js_1.prisma.communityMember.create({
                            data: {
                                channelId: channel.id,
                                userId: enr.userId,
                                role: 'MEMBER',
                            },
                        });
                        membershipsAdded++;
                    }
                }
            }
            return {
                success: true,
                channelsCreated,
                membershipsAdded,
                totalCourses: courses.length,
                totalEnrollments: enrollments.length,
            };
        }
        catch (error) {
            console.error('[CommunityService] Sync failed:', error);
            return { success: false, error: error.message };
        }
    }
}
exports.CommunityService = CommunityService;
exports.communityService = new CommunityService();

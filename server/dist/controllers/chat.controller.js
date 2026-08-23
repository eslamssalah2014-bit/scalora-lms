"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatMessage = exports.pinChatMessage = exports.sendChannelChatMessage = exports.getChannelChatMessages = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const realtime_service_js_1 = require("../services/realtime.service.js");
const chatMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Message cannot be empty'),
    mediaUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    fileUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    fileName: zod_1.z.string().optional().or(zod_1.z.literal('')),
    parentId: zod_1.z.string().optional(),
});
/**
 * Get chat room messages for a course community channel
 */
const getChannelChatMessages = async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const messages = await prisma_js_1.prisma.communityChatMessage.findMany({
            where: {
                channelId,
                deletedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: 150,
        });
        res.json({ success: true, messages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching chat messages' });
    }
};
exports.getChannelChatMessages = getChannelChatMessages;
/**
 * Post a new message into the course community group chat
 */
const sendChannelChatMessage = async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const channel = await prisma_js_1.prisma.communityChannel.findUnique({
            where: { id: channelId },
        });
        if (!channel) {
            res.status(404).json({ success: false, message: 'Community channel not found' });
            return;
        }
        const validatedData = chatMessageSchema.parse(req.body);
        const message = await prisma_js_1.prisma.communityChatMessage.create({
            data: {
                channelId,
                userId,
                content: validatedData.content.trim(),
                mediaUrl: validatedData.mediaUrl || null,
                fileUrl: validatedData.fileUrl || null,
                fileName: validatedData.fileName || null,
                parentId: validatedData.parentId || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        title: true,
                    },
                },
            },
        });
        // Realtime Broadcast to Channel
        realtime_service_js_1.realtimeService.broadcastToAll('chat_message', { channelId, message });
        res.status(201).json({ success: true, message });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error sending chat message' });
    }
};
exports.sendChannelChatMessage = sendChannelChatMessage;
/**
 * Pin or unpin a chat message (Trainers and Admins)
 */
const pinChatMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const userRole = req.user?.role;
        if (userRole !== 'ADMIN' && userRole !== 'TRAINER') {
            res.status(403).json({ success: false, message: 'Only trainers or admins can pin chat messages' });
            return;
        }
        const message = await prisma_js_1.prisma.communityChatMessage.findUnique({ where: { id } });
        if (!message) {
            res.status(404).json({ success: false, message: 'Message not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.communityChatMessage.update({
            where: { id },
            data: { isPinned: !message.isPinned },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
            },
        });
        // Realtime Broadcast Pin state
        realtime_service_js_1.realtimeService.broadcastToAll('chat_pin', {
            channelId: message.channelId,
            messageId: updated.id,
            isPinned: updated.isPinned,
        });
        res.json({ success: true, message: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error pinning chat message' });
    }
};
exports.pinChatMessage = pinChatMessage;
/**
 * Delete a chat message
 */
const deleteChatMessage = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const message = await prisma_js_1.prisma.communityChatMessage.findUnique({ where: { id } });
        if (!message) {
            res.status(404).json({ success: false, message: 'Message not found' });
            return;
        }
        if (message.userId !== userId && userRole !== 'ADMIN' && userRole !== 'TRAINER') {
            res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
            return;
        }
        const channelId = message.channelId;
        await prisma_js_1.prisma.communityChatMessage.delete({ where: { id } });
        // Realtime Broadcast Delete state
        realtime_service_js_1.realtimeService.broadcastToAll('chat_delete', {
            channelId,
            messageId: id,
        });
        res.json({ success: true, message: 'Chat message deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting chat message' });
    }
};
exports.deleteChatMessage = deleteChatMessage;

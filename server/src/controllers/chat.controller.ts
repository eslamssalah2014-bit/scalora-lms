import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  mediaUrl: z.string().optional().or(z.literal('')),
  fileUrl: z.string().optional().or(z.literal('')),
  fileName: z.string().optional().or(z.literal('')),
  parentId: z.string().optional(),
});

/**
 * Get chat room messages for a course community channel
 */
export const getChannelChatMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const messages = await prisma.communityChatMessage.findMany({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching chat messages' });
  }
};

/**
 * Post a new message into the course community group chat
 */
export const sendChannelChatMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const channel = await prisma.communityChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      res.status(404).json({ success: false, message: 'Community channel not found' });
      return;
    }

    const validatedData = chatMessageSchema.parse(req.body);

    const message = await prisma.communityChatMessage.create({
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

    res.status(201).json({ success: true, message });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error sending chat message' });
  }
};

/**
 * Pin or unpin a chat message (Trainers and Admins)
 */
export const pinChatMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN' && userRole !== 'TRAINER') {
      res.status(403).json({ success: false, message: 'Only trainers or admins can pin chat messages' });
      return;
    }

    const message = await prisma.communityChatMessage.findUnique({ where: { id } });
    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    const updated = await prisma.communityChatMessage.update({
      where: { id },
      data: { isPinned: !message.isPinned },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    res.json({ success: true, message: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error pinning chat message' });
  }
};

/**
 * Delete a chat message
 */
export const deleteChatMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const message = await prisma.communityChatMessage.findUnique({ where: { id } });
    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    if (message.userId !== userId && userRole !== 'ADMIN' && userRole !== 'TRAINER') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
      return;
    }

    await prisma.communityChatMessage.delete({ where: { id } });

    res.json({ success: true, message: 'Chat message deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting chat message' });
  }
};

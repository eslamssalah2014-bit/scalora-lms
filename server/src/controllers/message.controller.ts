import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const messageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Message content cannot be empty'),
  courseId: z.string().optional(),
  attachmentUrl: z.string().optional().or(z.literal('')),
  attachmentName: z.string().optional().or(z.literal('')),
  attachmentType: z.enum(['IMAGE', 'FILE']).optional(),
});

/**
 * Returns trainers assigned to courses where the current student is enrolled.
 */
export const getAvailableTrainersForStudent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.user?.role === 'ADMIN') {
      // Admins can message all trainers
      const trainers = await prisma.user.findMany({
        where: { role: 'TRAINER', deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          title: true,
          role: true,
          assignedCourses: {
            include: { course: { select: { id: true, title: true } } },
          },
        },
      });
      res.json({ success: true, trainers });
      return;
    }

    // Find student's active enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE', deletedAt: null },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      res.json({ success: true, trainers: [] });
      return;
    }

    // Find trainers assigned to these courses
    const courseTrainers = await prisma.courseTrainer.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        trainer: { deletedAt: null, status: 'ACTIVE' },
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            role: true,
          },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    });

    // Deduplicate trainers while attaching their courses
    const trainerMap = new Map<string, any>();
    for (const ct of courseTrainers) {
      if (!trainerMap.has(ct.trainer.id)) {
        trainerMap.set(ct.trainer.id, {
          ...ct.trainer,
          courses: [ct.course],
        });
      } else {
        trainerMap.get(ct.trainer.id).courses.push(ct.course);
      }
    }

    res.json({ success: true, trainers: Array.from(trainerMap.values()) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching available trainers' });
  }
};

/**
 * Returns conversation threads for the current user.
 */
export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Fetch all messages where user is sender or recipient
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: currentUserId }, { recipientId: currentUserId }],
        deletedAt: null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
        recipient: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group messages by the other participant
    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const isSender = msg.senderId === currentUserId;
      const partner = isSender ? msg.recipient : msg.sender;
      const partnerId = partner.id;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            isSender,
            isRead: msg.isRead,
          },
          unreadCount: !isSender && !msg.isRead ? 1 : 0,
        });
      } else {
        if (!isSender && !msg.isRead) {
          conversationMap.get(partnerId).unreadCount += 1;
        }
      }
    }

    res.json({
      success: true,
      conversations: Array.from(conversationMap.values()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching conversations' });
  }
};

/**
 * Get message history with a specific user.
 */
export const getMessagesWithUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const targetUserId = req.params.userId as string;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Mark all incoming unread messages as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: targetUserId,
        recipientId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Fetch conversation messages
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, recipientId: targetUserId },
          { senderId: targetUserId, recipientId: currentUserId },
        ],
        deletedAt: null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
        recipient: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, avatar: true, role: true, title: true, bio: true },
    });

    res.json({
      success: true,
      targetUser,
      messages,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching message thread' });
  }
};

/**
 * Send a direct message with strict permission validation.
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validatedData = messageSchema.parse(req.body);
    const { recipientId, content, courseId, attachmentUrl, attachmentName, attachmentType } = validatedData;

    if (senderId === recipientId) {
      res.status(400).json({ success: false, message: 'Cannot send messages to yourself' });
      return;
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, role: true, status: true },
    });

    if (!recipient || recipient.status === 'INACTIVE') {
      res.status(404).json({ success: false, message: 'Recipient user not found or inactive' });
      return;
    }

    // STRICT BUSINESS RULE CHECK:
    // If sender is STUDENT: Can only message TRAINERS assigned to courses the student is enrolled in.
    if (req.user?.role === 'STUDENT') {
      if (recipient.role !== 'TRAINER' && recipient.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Policy Violation: Students may only send direct messages to assigned course instructors/trainers.',
        });
        return;
      }

      if (recipient.role === 'TRAINER') {
        const studentEnrollments = await prisma.enrollment.findMany({
          where: { userId: senderId, status: 'ACTIVE', deletedAt: null },
          select: { courseId: true },
        });
        const enrolledCourseIds = studentEnrollments.map((e) => e.courseId);

        const isAssignedToEnrolledCourse = await prisma.courseTrainer.findFirst({
          where: {
            trainerId: recipientId,
            courseId: { in: enrolledCourseIds },
          },
        });

        if (!isAssignedToEnrolledCourse) {
          res.status(403).json({
            success: false,
            message: 'You can only message trainers assigned to courses you are actively enrolled in.',
          });
          return;
        }
      }
    }

    // Create Direct Message
    const message = await prisma.directMessage.create({
      data: {
        senderId,
        recipientId,
        courseId: courseId || null,
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
        isRead: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
        recipient: {
          select: { id: true, name: true, avatar: true, role: true, title: true },
        },
      },
    });

    res.status(201).json({ success: true, message });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error sending message' });
  }
};

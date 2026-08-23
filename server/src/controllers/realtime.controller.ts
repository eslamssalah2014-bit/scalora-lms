import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { realtimeService } from '../services/realtime.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';

/**
 * Connect to SSE Stream: GET /api/realtime/stream?token=...
 */
export const streamEvents = (req: Request, res: Response): void => {
  let token = req.query.token as string | undefined;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication token required for realtime stream' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const userId = decoded.id;

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.flushHeaders();

    const client = realtimeService.addClient(userId, res);

    // Remove client when connection closes
    req.on('close', () => {
      realtimeService.removeClient(userId, client);
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Broadcast Typing Indicator: POST /api/realtime/typing
 */
export const sendTypingIndicator = (req: AuthenticatedRequest, res: Response): void => {
  const senderId = req.user?.id;
  const { recipientId, isTyping } = req.body;

  if (!senderId || !recipientId) {
    res.status(400).json({ success: false, message: 'recipientId is required' });
    return;
  }

  realtimeService.sendToUser(recipientId, 'typing', {
    senderId,
    isTyping: Boolean(isTyping),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true });
};

/**
 * Broadcast Group Chat Typing: POST /api/realtime/chat-typing
 */
export const sendChatTypingIndicator = (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user?.id;
  const userName = req.user?.name || 'User';
  const { channelId, isTyping } = req.body;

  if (!userId || !channelId) {
    res.status(400).json({ success: false, message: 'channelId is required' });
    return;
  }

  realtimeService.broadcastToAll('chat_typing', {
    channelId,
    userId,
    userName,
    isTyping: Boolean(isTyping),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true });
};

/**
 * Get Online Status of users: GET /api/realtime/online
 */
export const getOnlineUsers = (_req: AuthenticatedRequest, res: Response): void => {
  const onlineUserIds = realtimeService.getOnlineUsers();
  res.json({ success: true, onlineUsers: onlineUserIds });
};

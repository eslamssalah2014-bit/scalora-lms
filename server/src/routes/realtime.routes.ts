import { Router } from 'express';
import {
  streamEvents,
  sendTypingIndicator,
  sendChatTypingIndicator,
  getOnlineUsers,
} from '../controllers/realtime.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// SSE Stream does authentication via query token ?token=... or header
router.get('/stream', streamEvents);

// Authenticated Realtime Actions
router.post('/typing', authenticate, sendTypingIndicator);
router.post('/chat-typing', authenticate, sendChatTypingIndicator);
router.get('/online', authenticate, getOnlineUsers);

export default router;

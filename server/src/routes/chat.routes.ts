import { Router } from 'express';
import {
  getChannelChatMessages,
  sendChannelChatMessage,
  pinChatMessage,
  deleteChatMessage,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/channels/:channelId', getChannelChatMessages);
router.post('/channels/:channelId', sendChannelChatMessage);
router.patch('/:id/pin', pinChatMessage);
router.delete('/:id', deleteChatMessage);

export default router;

import { Router } from 'express';
import {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  getAvailableTrainersForStudent,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/available-trainers', getAvailableTrainersForStudent);
router.get('/thread/:userId', getMessagesWithUser);
router.post('/', sendMessage);

export default router;

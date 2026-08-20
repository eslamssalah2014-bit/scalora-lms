import { Router } from 'express';
import { getLessonById, createLesson, updateLesson, deleteLesson } from '../controllers/lesson.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:id', authenticate, getLessonById);
router.post('/', authenticate, requireAdmin, createLesson);
router.put('/:id', authenticate, requireAdmin, updateLesson);
router.delete('/:id', authenticate, requireAdmin, deleteLesson);

export default router;

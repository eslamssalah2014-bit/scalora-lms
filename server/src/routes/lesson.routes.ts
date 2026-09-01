import { Router } from 'express';
import { getLessonById, createLesson, updateLesson, deleteLesson, reorderLessons } from '../controllers/lesson.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Reorder endpoints (must be declared before /:id)
router.put('/reorder', authenticate, requireAdmin, reorderLessons);
router.put('/reorder/module/:moduleId', authenticate, requireAdmin, reorderLessons);
router.post('/reorder', authenticate, requireAdmin, reorderLessons);

router.get('/:id', authenticate, getLessonById);
router.post('/', authenticate, requireAdmin, createLesson);
router.put('/:id', authenticate, requireAdmin, updateLesson);
router.delete('/:id', authenticate, requireAdmin, deleteLesson);

export default router;


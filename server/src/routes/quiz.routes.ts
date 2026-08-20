import { Router } from 'express';
import {
  getCourseQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
} from '../controllers/quiz.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/course/:courseId', authenticate, getCourseQuizzes);
router.get('/:id', authenticate, getQuizById);
router.post('/:id/submit', authenticate, submitQuizAttempt);

// Admin Quiz Management
router.post('/', authenticate, requireAdmin, createQuiz);
router.put('/:id', authenticate, requireAdmin, updateQuiz);
router.delete('/:id', authenticate, requireAdmin, deleteQuiz);

export default router;

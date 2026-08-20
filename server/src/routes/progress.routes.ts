import { Router } from 'express';
import { toggleLessonProgress, getCourseProgress, getCertificate } from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/toggle', authenticate, toggleLessonProgress);
router.get('/course/:courseId', authenticate, getCourseProgress);
router.get('/certificate/:courseId', authenticate, getCertificate);

export default router;

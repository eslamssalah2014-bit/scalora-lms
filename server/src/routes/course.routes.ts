import { Router } from 'express';
import {
  getPublishedCourses,
  getAllCoursesAdmin,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
} from '../controllers/course.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (with optional auth to detect enrollment)
router.get('/', getPublishedCourses);
router.get('/details/:slug', optionalAuth, getCourseBySlug);

// Admin-only routes
router.get('/admin/all', authenticate, requireAdmin, getAllCoursesAdmin);
router.post('/', authenticate, requireAdmin, createCourse);
router.put('/:id', authenticate, requireAdmin, updateCourse);
router.delete('/:id', authenticate, requireAdmin, deleteCourse);
router.patch('/:id/publish', authenticate, requireAdmin, togglePublishCourse);

export default router;

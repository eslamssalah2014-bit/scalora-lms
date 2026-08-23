import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  adminBroadcastNotification,
  adminGetBroadcastCourses,
} from '../controllers/notification.controller.js';

const router = Router();

// Student & User Notification Endpoints
router.get('/', authenticate, getMyNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

// Admin Broadcast Endpoints
router.post('/admin/broadcast', authenticate, adminBroadcastNotification);
router.get('/admin/courses', authenticate, adminGetBroadcastCourses);

export default router;

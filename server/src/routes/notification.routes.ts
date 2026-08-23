import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  adminBroadcastNotification,
  adminGetBroadcastAudience,
  adminGetBroadcastHistory,
  getVapidPublicKey,
  registerPushSubscription,
  sendTestPushNotification,
} from '../controllers/notification.controller.js';

const router = Router();

// Public VAPID Key for Web Push Subscriptions
router.get('/vapid-public-key', getVapidPublicKey);

// Student & User Notification Endpoints
router.get('/', authenticate, getMyNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

// Push Subscription & Device Registration
router.post('/push-subscription', authenticate, registerPushSubscription);
router.post('/test-push', authenticate, sendTestPushNotification);

// Admin Broadcast Endpoints
router.post('/admin/broadcast', authenticate, adminBroadcastNotification);
router.get('/admin/audience', authenticate, adminGetBroadcastAudience);
router.get('/admin/history', authenticate, adminGetBroadcastHistory);
router.get('/admin/courses', authenticate, adminGetBroadcastAudience);

export default router;

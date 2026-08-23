"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const router = (0, express_1.Router)();
// Public VAPID Key for Web Push Subscriptions
router.get('/vapid-public-key', notification_controller_js_1.getVapidPublicKey);
// Student & User Notification Endpoints
router.get('/', auth_middleware_js_1.authenticate, notification_controller_js_1.getMyNotifications);
router.patch('/read-all', auth_middleware_js_1.authenticate, notification_controller_js_1.markAllNotificationsRead);
router.patch('/:id/read', auth_middleware_js_1.authenticate, notification_controller_js_1.markNotificationRead);
router.delete('/:id', auth_middleware_js_1.authenticate, notification_controller_js_1.deleteNotification);
// Push Subscription & Device Registration
router.post('/push-subscription', auth_middleware_js_1.authenticate, notification_controller_js_1.registerPushSubscription);
router.post('/test-push', auth_middleware_js_1.authenticate, notification_controller_js_1.sendTestPushNotification);
// Admin Broadcast Endpoints
router.post('/admin/broadcast', auth_middleware_js_1.authenticate, notification_controller_js_1.adminBroadcastNotification);
router.get('/admin/audience', auth_middleware_js_1.authenticate, notification_controller_js_1.adminGetBroadcastAudience);
router.get('/admin/history', auth_middleware_js_1.authenticate, notification_controller_js_1.adminGetBroadcastHistory);
router.get('/admin/courses', auth_middleware_js_1.authenticate, notification_controller_js_1.adminGetBroadcastAudience);
exports.default = router;

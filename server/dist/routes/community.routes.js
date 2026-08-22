"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const community_controller_js_1 = require("../controllers/community.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// ============================================================================
// CHANNELS & MEMBERS
// ============================================================================
router.get('/channels', auth_middleware_js_1.authenticate, community_controller_js_1.getCommunityChannels);
router.get('/channels/:id', auth_middleware_js_1.authenticate, community_controller_js_1.getCommunityChannelById);
router.get('/channels/:id/members', auth_middleware_js_1.authenticate, community_controller_js_1.getChannelMembers);
// ============================================================================
// POSTS (FEED, CRUD, LIKES, SAVES, PIN)
// ============================================================================
router.get('/channels/:id/posts', auth_middleware_js_1.authenticate, community_controller_js_1.getChannelPosts);
router.post('/posts', auth_middleware_js_1.authenticate, community_controller_js_1.createPost);
router.put('/posts/:id', auth_middleware_js_1.authenticate, community_controller_js_1.updatePost);
router.delete('/posts/:id', auth_middleware_js_1.authenticate, community_controller_js_1.deletePost);
router.post('/posts/:id/like', auth_middleware_js_1.authenticate, community_controller_js_1.toggleLikePost);
router.post('/posts/:id/save', auth_middleware_js_1.authenticate, community_controller_js_1.toggleSavePost);
router.patch('/posts/:id/pin', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.togglePinPost);
// ============================================================================
// COMMENTS & REPLIES
// ============================================================================
router.get('/posts/:id/comments', auth_middleware_js_1.authenticate, community_controller_js_1.getPostComments);
router.post('/posts/:id/comments', auth_middleware_js_1.authenticate, community_controller_js_1.createComment);
router.delete('/comments/:id', auth_middleware_js_1.authenticate, community_controller_js_1.deleteComment);
// ============================================================================
// NOTIFICATIONS
// ============================================================================
router.get('/notifications', auth_middleware_js_1.authenticate, community_controller_js_1.getMyNotifications);
router.patch('/notifications/read-all', auth_middleware_js_1.authenticate, community_controller_js_1.markAllNotificationsRead);
router.patch('/notifications/:id/read', auth_middleware_js_1.authenticate, community_controller_js_1.markNotificationRead);
// ============================================================================
// MEMBER PROFILES & SEARCH
// ============================================================================
router.get('/members/:userId/profile', auth_middleware_js_1.authenticate, community_controller_js_1.getMemberProfile);
router.get('/search', auth_middleware_js_1.authenticate, community_controller_js_1.searchCommunity);
// ============================================================================
// ADMIN COMMUNITY MANAGEMENT
// ============================================================================
router.get('/admin/overview', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.getAdminCommunityOverview);
router.patch('/admin/channels/:id/lock', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.toggleChannelLock);
router.patch('/admin/channels/:id/archive', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.toggleChannelArchive);
router.delete('/admin/channels/:channelId/members/:userId', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.removeChannelMember);
router.post('/admin/announcements', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, community_controller_js_1.broadcastAdminAnnouncement);
exports.default = router;

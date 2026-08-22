import { Router } from 'express';
import {
  getCommunityChannels,
  getCommunityChannelById,
  getChannelMembers,
  getChannelPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  toggleSavePost,
  togglePinPost,
  getPostComments,
  createComment,
  deleteComment,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMemberProfile,
  searchCommunity,
  getAdminCommunityOverview,
  toggleChannelLock,
  toggleChannelArchive,
  removeChannelMember,
  broadcastAdminAnnouncement,
} from '../controllers/community.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ============================================================================
// CHANNELS & MEMBERS
// ============================================================================
router.get('/channels', authenticate, getCommunityChannels);
router.get('/channels/:id', authenticate, getCommunityChannelById);
router.get('/channels/:id/members', authenticate, getChannelMembers);

// ============================================================================
// POSTS (FEED, CRUD, LIKES, SAVES, PIN)
// ============================================================================
router.get('/channels/:id/posts', authenticate, getChannelPosts);
router.post('/posts', authenticate, createPost);
router.put('/posts/:id', authenticate, updatePost);
router.delete('/posts/:id', authenticate, deletePost);
router.post('/posts/:id/like', authenticate, toggleLikePost);
router.post('/posts/:id/save', authenticate, toggleSavePost);
router.patch('/posts/:id/pin', authenticate, requireAdmin, togglePinPost);

// ============================================================================
// COMMENTS & REPLIES
// ============================================================================
router.get('/posts/:id/comments', authenticate, getPostComments);
router.post('/posts/:id/comments', authenticate, createComment);
router.delete('/comments/:id', authenticate, deleteComment);

// ============================================================================
// NOTIFICATIONS
// ============================================================================
router.get('/notifications', authenticate, getMyNotifications);
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

// ============================================================================
// MEMBER PROFILES & SEARCH
// ============================================================================
router.get('/members/:userId/profile', authenticate, getMemberProfile);
router.get('/search', authenticate, searchCommunity);

// ============================================================================
// ADMIN COMMUNITY MANAGEMENT
// ============================================================================
router.get('/admin/overview', authenticate, requireAdmin, getAdminCommunityOverview);
router.patch('/admin/channels/:id/lock', authenticate, requireAdmin, toggleChannelLock);
router.patch('/admin/channels/:id/archive', authenticate, requireAdmin, toggleChannelArchive);
router.delete('/admin/channels/:channelId/members/:userId', authenticate, requireAdmin, removeChannelMember);
router.post('/admin/announcements', authenticate, requireAdmin, broadcastAdminAnnouncement);

export default router;

import { Router } from 'express';
import {
  getAdminSubmissions,
  getAdminSubmissionStats,
  getAdminSubmissionDetails,
  approveSubmission,
  rejectSubmission,
  requestRevision,
  getAdminTracks,
  createAdminTrack,
  updateAdminTrack,
  deleteAdminTrack,
  getAdminPolicy,
  updateAdminPolicy,
} from '../controllers/admin-submission.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate, requireAdmin);

// Submissions Review
router.get('/stats', getAdminSubmissionStats);
router.get('/tracks', getAdminTracks);
router.post('/tracks', createAdminTrack);
router.put('/tracks/:id', updateAdminTrack);
router.delete('/tracks/:id', deleteAdminTrack);

router.get('/policy', getAdminPolicy);
router.put('/policy', updateAdminPolicy);

router.get('/', getAdminSubmissions);
router.get('/:id', getAdminSubmissionDetails);
router.post('/:id/approve', approveSubmission);
router.post('/:id/reject', rejectSubmission);
router.post('/:id/request-revision', requestRevision);

export default router;

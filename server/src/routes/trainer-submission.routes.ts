import { Router } from 'express';
import {
  getActiveTracks,
  getActivePolicy,
  acceptPolicy,
  registerTrainerProfile,
  getTrainerProfile,
  saveCourseDraft,
  submitCourseForReview,
  getMySubmissions,
  getSubmissionById,
  deleteDraftSubmission,
} from '../controllers/trainer-submission.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public / optionally authenticated
router.get('/tracks', getActiveTracks);
router.get('/policy', optionalAuth, getActivePolicy);
router.post('/register', optionalAuth, registerTrainerProfile);

// Authenticated Trainer routes
router.post('/policy/accept', authenticate, acceptPolicy);
router.get('/profile', authenticate, getTrainerProfile);
router.post('/save-draft', authenticate, saveCourseDraft);
router.post('/submit', authenticate, submitCourseForReview);
router.get('/my-submissions', authenticate, getMySubmissions);
router.get('/:id', authenticate, getSubmissionById);
router.delete('/:id', authenticate, deleteDraftSubmission);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getStudentPlan,
  saveStudentPlan,
  getAllStudentPlans,
  getAdminAnalytics,
  triggerDailyReminders,
} from '../controllers/study-planner.controller.js';

const router = Router();

// Student endpoints
router.get('/plan', authenticate, getStudentPlan);
router.post('/plan', authenticate, saveStudentPlan);
router.get('/all', authenticate, getAllStudentPlans);

// Admin endpoints
router.get('/analytics', authenticate, getAdminAnalytics);
router.post('/trigger-reminders', authenticate, triggerDailyReminders);

export default router;

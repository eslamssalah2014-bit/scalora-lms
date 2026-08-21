import { Router } from 'express';
import {
  getDashboardStats,
  getStudentsList,
  getStudentDetails,
  updateStudent,
  resetStudentPassword,
  getStudentActivity,
  getPlatformSettings,
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getDashboardStats);
router.get('/students', authenticate, requireAdmin, getStudentsList);
router.get('/students/:id', authenticate, requireAdmin, getStudentDetails);
router.put('/students/:id', authenticate, requireAdmin, updateStudent);
router.post('/students/:id/reset-password', authenticate, requireAdmin, resetStudentPassword);
router.get('/students/:id/activity', authenticate, requireAdmin, getStudentActivity);
router.get('/settings', authenticate, requireAdmin, getPlatformSettings);

export default router;

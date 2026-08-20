import { Router } from 'express';
import { getDashboardStats, getStudentsList, getPlatformSettings } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, getDashboardStats);
router.get('/students', authenticate, requireAdmin, getStudentsList);
router.get('/settings', authenticate, requireAdmin, getPlatformSettings);

export default router;

import { Router } from 'express';
import { getMyEnrollments, getAllEnrollmentsAdmin, manualEnroll } from '../controllers/enrollment.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/my', authenticate, getMyEnrollments);
router.get('/my-courses', authenticate, getMyEnrollments);
router.get('/admin/all', authenticate, requireAdmin, getAllEnrollmentsAdmin);
router.post('/admin/manual', authenticate, requireAdmin, manualEnroll);

export default router;

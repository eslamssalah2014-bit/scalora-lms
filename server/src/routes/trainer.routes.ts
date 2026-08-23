import { Router } from 'express';
import {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  toggleTrainerStatus,
  getTrainerDashboardStats,
} from '../controllers/trainer.controller.js';
import { authenticate, requireAdmin, requireTrainerOrAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Authenticated listings
router.get('/', getAllTrainers);
router.get('/dashboard/stats', authenticate, requireTrainerOrAdmin, getTrainerDashboardStats);
router.get('/:id', getTrainerById);

// Admin Only Trainer Management
router.post('/', authenticate, requireAdmin, createTrainer);
router.put('/:id', authenticate, requireTrainerOrAdmin, updateTrainer);
router.patch('/:id/status', authenticate, requireAdmin, toggleTrainerStatus);

export default router;

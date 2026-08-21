import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  addLeadNote,
  deleteLead,
  getAssignees,
} from '../controllers/lead.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public: consultation request submission
router.post('/', createLead);

// Protected Admin routes
router.get('/', authenticate, requireAdmin, getLeads);
router.get('/assignees', authenticate, requireAdmin, getAssignees);
router.get('/:id', authenticate, requireAdmin, getLeadById);
router.put('/:id', authenticate, requireAdmin, updateLead);
router.post('/:id/notes', authenticate, requireAdmin, addLeadNote);
router.delete('/:id', authenticate, requireAdmin, deleteLead);

export default router;

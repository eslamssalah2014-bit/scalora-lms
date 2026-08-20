import { Router } from 'express';
import { createModule, updateModule, deleteModule } from '../controllers/module.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, requireAdmin, createModule);
router.put('/:id', authenticate, requireAdmin, updateModule);
router.delete('/:id', authenticate, requireAdmin, deleteModule);

export default router;

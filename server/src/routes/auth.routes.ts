import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  validateSetupToken,
  setupPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/forgot-password', forgotPassword);
router.get('/setup-token/:token', validateSetupToken);
router.post('/setup-password', setupPassword);

export default router;


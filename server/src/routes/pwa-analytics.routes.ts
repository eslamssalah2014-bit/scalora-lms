import { Router } from 'express';
import { trackPwaEvent, getPwaAnalytics } from '../controllers/pwa-analytics.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Authenticated PWA event tracking endpoint
router.post('/track', optionalAuth, trackPwaEvent);

// Admin-only PWA Analytics Dashboard data endpoint
router.get('/', authenticate, requireAdmin, getPwaAnalytics);

export default router;

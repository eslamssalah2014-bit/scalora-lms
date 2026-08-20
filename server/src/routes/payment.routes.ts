import { Router } from 'express';
import { checkout, getPaymentGateways } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/gateways', authenticate, getPaymentGateways);
router.post('/checkout', authenticate, checkout);

export default router;

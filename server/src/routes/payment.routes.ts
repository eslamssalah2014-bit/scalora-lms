import { Router } from 'express';
import {
  checkout,
  getPaymentGateways,
  submitInstaPayPayment,
  getAdminPaymentRequests,
  getPaymentRequestById,
  approvePaymentRequest,
  rejectPaymentRequest,
  deletePaymentRequest,
} from '../controllers/payment.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Student routes
router.get('/gateways', authenticate, getPaymentGateways);
router.post('/checkout', authenticate, checkout);
router.post('/instapay', optionalAuth, submitInstaPayPayment);

// Admin Payment Verification routes
router.get('/admin/requests', authenticate, requireAdmin, getAdminPaymentRequests);
router.get('/admin/requests/:id', authenticate, requireAdmin, getPaymentRequestById);
router.post('/admin/requests/:id/approve', authenticate, requireAdmin, approvePaymentRequest);
router.post('/admin/requests/:id/reject', authenticate, requireAdmin, rejectPaymentRequest);
router.delete('/admin/requests/:id', authenticate, requireAdmin, deletePaymentRequest);

export default router;


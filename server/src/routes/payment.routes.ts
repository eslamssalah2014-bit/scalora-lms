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
  createKashierCheckoutSession,
  verifyKashierPayment,
  kashierWebhook,
  getStudentPurchaseHistory,
  getAllPaymentsAdmin,
  processAdminRefund,
} from '../controllers/payment.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Gateway info & general checkout
router.get('/gateways', authenticate, getPaymentGateways);
router.post('/checkout', authenticate, checkout);
router.post('/instapay', optionalAuth, submitInstaPayPayment);

// Kashier Live Gateway Routes
router.post('/kashier/create-session', authenticate, createKashierCheckoutSession);
router.post('/kashier/verify', optionalAuth, verifyKashierPayment);
router.post('/kashier/webhook', kashierWebhook);

// Student Purchase History
router.get('/history', authenticate, getStudentPurchaseHistory);

// Admin Payment Ledger, Verification & Refund Routes
router.get('/admin/all', authenticate, requireAdmin, getAllPaymentsAdmin);
router.post('/admin/:id/refund', authenticate, requireAdmin, processAdminRefund);
router.get('/admin/requests', authenticate, requireAdmin, getAdminPaymentRequests);
router.get('/admin/requests/:id', authenticate, requireAdmin, getPaymentRequestById);
router.post('/admin/requests/:id/approve', authenticate, requireAdmin, approvePaymentRequest);
router.post('/admin/requests/:id/reject', authenticate, requireAdmin, rejectPaymentRequest);
router.delete('/admin/requests/:id', authenticate, requireAdmin, deletePaymentRequest);

export default router;

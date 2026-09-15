"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_js_1 = require("../controllers/payment.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Gateway info & general checkout
router.get('/gateways', auth_middleware_js_1.authenticate, payment_controller_js_1.getPaymentGateways);
router.post('/checkout', auth_middleware_js_1.authenticate, payment_controller_js_1.checkout);
router.post('/instapay', auth_middleware_js_1.optionalAuth, payment_controller_js_1.submitInstaPayPayment);
// Kashier Live Gateway Routes
router.post('/kashier/create-session', auth_middleware_js_1.authenticate, payment_controller_js_1.createKashierCheckoutSession);
router.post('/kashier/verify', auth_middleware_js_1.optionalAuth, payment_controller_js_1.verifyKashierPayment);
router.post('/kashier/webhook', payment_controller_js_1.kashierWebhook);
// Student Purchase History
router.get('/history', auth_middleware_js_1.authenticate, payment_controller_js_1.getStudentPurchaseHistory);
// Admin Payment Ledger, Verification & Refund Routes
router.get('/admin/all', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.getAllPaymentsAdmin);
router.post('/admin/:id/refund', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.processAdminRefund);
router.get('/admin/requests', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.getAdminPaymentRequests);
router.get('/admin/requests/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.getPaymentRequestById);
router.post('/admin/requests/:id/approve', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.approvePaymentRequest);
router.post('/admin/requests/:id/reject', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.rejectPaymentRequest);
router.delete('/admin/requests/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.deletePaymentRequest);
exports.default = router;

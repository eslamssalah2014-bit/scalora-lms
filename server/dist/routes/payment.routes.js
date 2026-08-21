"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_js_1 = require("../controllers/payment.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Student routes
router.get('/gateways', auth_middleware_js_1.authenticate, payment_controller_js_1.getPaymentGateways);
router.post('/checkout', auth_middleware_js_1.authenticate, payment_controller_js_1.checkout);
router.post('/instapay', auth_middleware_js_1.authenticate, payment_controller_js_1.submitInstaPayPayment);
// Admin Payment Verification routes
router.get('/admin/requests', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.getAdminPaymentRequests);
router.get('/admin/requests/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.getPaymentRequestById);
router.post('/admin/requests/:id/approve', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.approvePaymentRequest);
router.post('/admin/requests/:id/reject', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.rejectPaymentRequest);
router.delete('/admin/requests/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, payment_controller_js_1.deletePaymentRequest);
exports.default = router;

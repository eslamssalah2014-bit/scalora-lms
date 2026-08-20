"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_js_1 = require("../controllers/payment.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.get('/gateways', auth_middleware_js_1.authenticate, payment_controller_js_1.getPaymentGateways);
router.post('/checkout', auth_middleware_js_1.authenticate, payment_controller_js_1.checkout);
exports.default = router;

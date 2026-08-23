"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pwa_analytics_controller_js_1 = require("../controllers/pwa-analytics.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public / Authenticated PWA event tracking endpoint
router.post('/track', auth_middleware_js_1.optionalAuth, pwa_analytics_controller_js_1.trackPwaEvent);
// Admin-only PWA Analytics Dashboard data endpoint
router.get('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, pwa_analytics_controller_js_1.getPwaAnalytics);
exports.default = router;

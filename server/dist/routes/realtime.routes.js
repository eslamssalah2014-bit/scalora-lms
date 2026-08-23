"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const realtime_controller_js_1 = require("../controllers/realtime.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// SSE Stream does authentication via query token ?token=... or header
router.get('/stream', realtime_controller_js_1.streamEvents);
// Authenticated Realtime Actions
router.post('/typing', auth_middleware_js_1.authenticate, realtime_controller_js_1.sendTypingIndicator);
router.post('/chat-typing', auth_middleware_js_1.authenticate, realtime_controller_js_1.sendChatTypingIndicator);
router.get('/online', auth_middleware_js_1.authenticate, realtime_controller_js_1.getOnlineUsers);
exports.default = router;

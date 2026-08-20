"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quiz_controller_js_1 = require("../controllers/quiz.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.get('/course/:courseId', auth_middleware_js_1.authenticate, quiz_controller_js_1.getCourseQuizzes);
router.get('/:id', auth_middleware_js_1.authenticate, quiz_controller_js_1.getQuizById);
router.post('/:id/submit', auth_middleware_js_1.authenticate, quiz_controller_js_1.submitQuizAttempt);
// Admin Quiz Management
router.post('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, quiz_controller_js_1.createQuiz);
router.put('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, quiz_controller_js_1.updateQuiz);
router.delete('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, quiz_controller_js_1.deleteQuiz);
exports.default = router;

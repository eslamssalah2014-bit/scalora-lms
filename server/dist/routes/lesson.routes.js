"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lesson_controller_js_1 = require("../controllers/lesson.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Reorder endpoints (must be declared before /:id)
router.put('/reorder', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.reorderLessons);
router.put('/reorder/module/:moduleId', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.reorderLessons);
router.post('/reorder', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.reorderLessons);
router.get('/:id', auth_middleware_js_1.authenticate, lesson_controller_js_1.getLessonById);
router.post('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.createLesson);
router.put('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.updateLesson);
router.delete('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lesson_controller_js_1.deleteLesson);
exports.default = router;

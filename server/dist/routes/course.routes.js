"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const course_controller_js_1 = require("../controllers/course.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Category routes
router.get('/categories', course_controller_js_1.getCategories);
router.post('/categories', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.createCategory);
router.delete('/categories/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.deleteCategory);
// Public routes (with optional auth to detect enrollment)
router.get('/', course_controller_js_1.getPublishedCourses);
router.get('/details/:slug', auth_middleware_js_1.optionalAuth, course_controller_js_1.getCourseBySlug);
// Admin-only routes
router.get('/admin/all', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.getAllCoursesAdmin);
router.post('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.createCourse);
router.put('/:id/pricing', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.updateCoursePricing);
router.put('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.updateCourse);
router.delete('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.deleteCourse);
router.patch('/:id/publish', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, course_controller_js_1.togglePublishCourse);
exports.default = router;

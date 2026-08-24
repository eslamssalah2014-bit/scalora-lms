"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const study_planner_controller_js_1 = require("../controllers/study-planner.controller.js");
const router = (0, express_1.Router)();
// Student endpoints
router.get('/plan', auth_middleware_js_1.authenticate, study_planner_controller_js_1.getStudentPlan);
router.post('/plan', auth_middleware_js_1.authenticate, study_planner_controller_js_1.saveStudentPlan);
router.get('/all', auth_middleware_js_1.authenticate, study_planner_controller_js_1.getAllStudentPlans);
// Admin endpoints
router.get('/analytics', auth_middleware_js_1.authenticate, study_planner_controller_js_1.getAdminAnalytics);
router.post('/trigger-reminders', auth_middleware_js_1.authenticate, study_planner_controller_js_1.triggerDailyReminders);
exports.default = router;

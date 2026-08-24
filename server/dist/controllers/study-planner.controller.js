"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDailyReminders = exports.getAdminAnalytics = exports.getAllStudentPlans = exports.saveStudentPlan = exports.getStudentPlan = void 0;
const study_planner_service_js_1 = require("../services/study-planner.service.js");
/**
 * GET /api/study-planner/plan?courseId=...
 * Retrieve or auto-generate plan metrics for a course
 */
const getStudentPlan = async (req, res) => {
    try {
        const userId = req.user?.id;
        const courseId = req.query.courseId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!courseId) {
            res.status(400).json({ success: false, message: 'courseId query parameter is required' });
            return;
        }
        const metrics = await study_planner_service_js_1.studyPlannerService.getPlanMetrics(userId, courseId);
        if (!metrics) {
            res.status(404).json({ success: false, message: 'Course not found or study plan unavailable' });
            return;
        }
        res.json({
            success: true,
            plan: metrics,
        });
    }
    catch (err) {
        console.error('[StudyPlannerController] getStudentPlan error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to retrieve study plan' });
    }
};
exports.getStudentPlan = getStudentPlan;
/**
 * POST /api/study-planner/plan
 * Create or customize target days or completion date
 */
const saveStudentPlan = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { courseId, targetDays, customTargetDate } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!courseId) {
            res.status(400).json({ success: false, message: 'courseId is required' });
            return;
        }
        const days = Number(targetDays) || 14;
        await study_planner_service_js_1.studyPlannerService.createOrUpdatePlan(userId, courseId, days, customTargetDate);
        const metrics = await study_planner_service_js_1.studyPlannerService.getPlanMetrics(userId, courseId);
        res.json({
            success: true,
            message: 'Study plan updated successfully',
            plan: metrics,
        });
    }
    catch (err) {
        console.error('[StudyPlannerController] saveStudentPlan error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to save study plan' });
    }
};
exports.saveStudentPlan = saveStudentPlan;
/**
 * GET /api/study-planner/all
 * Retrieve all active plans for enrolled courses of the logged-in student
 */
const getAllStudentPlans = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const plans = await study_planner_service_js_1.studyPlannerService.getAllPlansForStudent(userId);
        res.json({
            success: true,
            plans,
        });
    }
    catch (err) {
        console.error('[StudyPlannerController] getAllStudentPlans error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to load study plans' });
    }
};
exports.getAllStudentPlans = getAllStudentPlans;
/**
 * GET /api/study-planner/analytics
 * Executive analytics for Admin Dashboard
 */
const getAdminAnalytics = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }
        const analytics = await study_planner_service_js_1.studyPlannerService.getAnalytics();
        res.json({
            success: true,
            analytics,
        });
    }
    catch (err) {
        console.error('[StudyPlannerController] getAdminAnalytics error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to load study planner analytics' });
    }
};
exports.getAdminAnalytics = getAdminAnalytics;
/**
 * POST /api/study-planner/trigger-reminders
 * Admin / Cron trigger for daily 9:00 AM reminders
 */
const triggerDailyReminders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }
        const result = await study_planner_service_js_1.studyPlannerService.sendDailyStudyReminders();
        res.json({
            success: true,
            message: `Dispatched daily reminders to ${result.delivered} students`,
            delivered: result.delivered,
        });
    }
    catch (err) {
        console.error('[StudyPlannerController] triggerDailyReminders error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to dispatch reminders' });
    }
};
exports.triggerDailyReminders = triggerDailyReminders;

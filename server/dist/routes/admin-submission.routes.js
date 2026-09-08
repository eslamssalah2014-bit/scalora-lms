"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_submission_controller_js_1 = require("../controllers/admin-submission.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// All routes require authentication and ADMIN role
router.use(auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin);
// Submissions Review
router.get('/stats', admin_submission_controller_js_1.getAdminSubmissionStats);
router.get('/tracks', admin_submission_controller_js_1.getAdminTracks);
router.post('/tracks', admin_submission_controller_js_1.createAdminTrack);
router.put('/tracks/:id', admin_submission_controller_js_1.updateAdminTrack);
router.delete('/tracks/:id', admin_submission_controller_js_1.deleteAdminTrack);
router.get('/policy', admin_submission_controller_js_1.getAdminPolicy);
router.put('/policy', admin_submission_controller_js_1.updateAdminPolicy);
router.get('/', admin_submission_controller_js_1.getAdminSubmissions);
router.get('/:id', admin_submission_controller_js_1.getAdminSubmissionDetails);
router.post('/:id/approve', admin_submission_controller_js_1.approveSubmission);
router.post('/:id/reject', admin_submission_controller_js_1.rejectSubmission);
router.post('/:id/request-revision', admin_submission_controller_js_1.requestRevision);
exports.default = router;

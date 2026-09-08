"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainer_submission_controller_js_1 = require("../controllers/trainer-submission.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public / optionally authenticated
router.get('/tracks', trainer_submission_controller_js_1.getActiveTracks);
router.get('/policy', auth_middleware_js_1.optionalAuth, trainer_submission_controller_js_1.getActivePolicy);
router.post('/register', auth_middleware_js_1.optionalAuth, trainer_submission_controller_js_1.registerTrainerProfile);
// Authenticated Trainer routes
router.post('/policy/accept', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.acceptPolicy);
router.get('/profile', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.getTrainerProfile);
router.post('/save-draft', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.saveCourseDraft);
router.post('/submit', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.submitCourseForReview);
router.get('/my-submissions', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.getMySubmissions);
router.get('/:id', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.getSubmissionById);
router.delete('/:id', auth_middleware_js_1.authenticate, trainer_submission_controller_js_1.deleteDraftSubmission);
exports.default = router;

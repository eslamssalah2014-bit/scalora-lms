"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainer_controller_js_1 = require("../controllers/trainer.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public / Authenticated listings
router.get('/', trainer_controller_js_1.getAllTrainers);
router.get('/dashboard/stats', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireTrainerOrAdmin, trainer_controller_js_1.getTrainerDashboardStats);
router.get('/:id', trainer_controller_js_1.getTrainerById);
// Admin Only Trainer Management
router.post('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, trainer_controller_js_1.createTrainer);
router.put('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireTrainerOrAdmin, trainer_controller_js_1.updateTrainer);
router.patch('/:id/status', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, trainer_controller_js_1.toggleTrainerStatus);
exports.default = router;

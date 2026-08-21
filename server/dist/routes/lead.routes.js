"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_js_1 = require("../controllers/lead.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public: consultation request submission
router.post('/', lead_controller_js_1.createLead);
// Protected Admin routes
router.get('/', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.getLeads);
router.get('/assignees', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.getAssignees);
router.get('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.getLeadById);
router.put('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.updateLead);
router.post('/:id/notes', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.addLeadNote);
router.delete('/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, lead_controller_js_1.deleteLead);
exports.default = router;

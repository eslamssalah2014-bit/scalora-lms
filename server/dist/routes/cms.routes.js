"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cms_controller_js_1 = require("../controllers/cms.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// ============================================================================
// PUBLIC READ-ONLY ROUTES (FAST & UNPROTECTED)
// ============================================================================
router.get('/published-all', cms_controller_js_1.getAllPublished);
router.get('/published/:key', cms_controller_js_1.getPublishedDocument);
router.get('/theme', cms_controller_js_1.getTheme);
router.get('/sitemap.xml', cms_controller_js_1.getSitemapXml);
// ============================================================================
// ADMIN CMS ROUTES (PROTECTED BY AUTH & REQUIRE ADMIN ROLE)
// ============================================================================
router.get('/admin/documents', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.getAdminDocuments);
router.get('/admin/document/:key', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.getAdminDocumentByKey);
router.put('/admin/document/:key', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.saveAdminDraft);
router.post('/admin/document/:key/publish', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.publishAdminDraft);
router.post('/admin/document/:key/revert', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.revertAdminDraft);
router.post('/admin/document/:key/restore-revision', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.restoreAdminRevision);
router.post('/admin/document/:key/reset-defaults', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.resetAdminToDefaults);
// Admin Media Library Endpoints
router.get('/admin/media', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.getMediaLibrary);
router.post('/admin/media/upload', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.uploadMedia);
router.put('/admin/media/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.updateMedia);
router.delete('/admin/media/:id', auth_middleware_js_1.authenticate, auth_middleware_js_1.requireAdmin, cms_controller_js_1.deleteMedia);
exports.default = router;

import { Router } from 'express';
import {
  getPublishedDocument,
  getAllPublished,
  getTheme,
  getSitemapXml,
  getAdminDocuments,
  getAdminDocumentByKey,
  saveAdminDraft,
  publishAdminDraft,
  revertAdminDraft,
  restoreAdminRevision,
  resetAdminToDefaults,
  getMediaLibrary,
  uploadMedia,
  updateMedia,
  deleteMedia,
} from '../controllers/cms.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ============================================================================
// PUBLIC READ-ONLY ROUTES (FAST & UNPROTECTED)
// ============================================================================
router.get('/published-all', getAllPublished);
router.get('/published/:key', getPublishedDocument);
router.get('/theme', getTheme);
router.get('/sitemap.xml', getSitemapXml);

// ============================================================================
// ADMIN CMS ROUTES (PROTECTED BY AUTH & REQUIRE ADMIN ROLE)
// ============================================================================
router.get('/admin/documents', authenticate, requireAdmin, getAdminDocuments);
router.get('/admin/document/:key', authenticate, requireAdmin, getAdminDocumentByKey);
router.put('/admin/document/:key', authenticate, requireAdmin, saveAdminDraft);
router.post('/admin/document/:key/publish', authenticate, requireAdmin, publishAdminDraft);
router.post('/admin/document/:key/revert', authenticate, requireAdmin, revertAdminDraft);
router.post('/admin/document/:key/restore-revision', authenticate, requireAdmin, restoreAdminRevision);
router.post('/admin/document/:key/reset-defaults', authenticate, requireAdmin, resetAdminToDefaults);

// Admin Media Library Endpoints
router.get('/admin/media', authenticate, requireAdmin, getMediaLibrary);
router.post('/admin/media/upload', authenticate, requireAdmin, uploadMedia);
router.put('/admin/media/:id', authenticate, requireAdmin, updateMedia);
router.delete('/admin/media/:id', authenticate, requireAdmin, deleteMedia);

export default router;

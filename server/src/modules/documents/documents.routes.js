const express = require('express');
const multer = require('multer');
const documentController = require('./documents.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

// Multer memory storage (Phase 1)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 }
});

/**
 * @route GET /api/v1/documents
 * @access authenticated
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin', 'worker', 'officer', 'assistant'), documentController.listAllDocuments);

/**
 * @route GET /api/v1/documents/mine
 * @access worker, officer, assistant
 */
router.get('/mine', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), documentController.getMyDocuments);

/**
 * @route GET /api/v1/documents/inbox
 * @access worker, officer, assistant
 */
router.get('/inbox', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), documentController.getInbox);

/**
 * @route GET /api/v1/documents/department
 * @access worker, officer, assistant
 */
router.get('/department', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), documentController.getDepartmentHistory);

/**
 * @route GET /api/v1/documents/:id
 * @access authenticated
 */
router.get('/:id', authMiddleware, documentController.getDocumentDetail);

/**
 * @route GET /api/v1/documents/:id/attachment
 * @access authenticated
 */
router.get('/:id/attachment', authMiddleware, documentController.downloadAttachment);

/**
 * @route POST /api/v1/documents
 * @access worker, officer
 */
router.post('/', authMiddleware, rbacMiddleware('worker', 'officer'), upload.single('file'), documentController.createDocument);

/**
 * @route POST /api/v1/documents/:id/pickup
 * @access worker, officer, assistant
 */
router.post('/:id/pickup', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), documentController.pickupDocument);

/**
 * @route POST /api/v1/documents/:id/start
 * @access worker, officer
 */
router.post('/:id/start', authMiddleware, rbacMiddleware('worker', 'officer'), documentController.startProcessing);

/**
 * @route POST /api/v1/documents/:id/complete
 * @access worker, officer
 */
router.post('/:id/complete', authMiddleware, rbacMiddleware('worker', 'officer'), documentController.completeDocument);

/**
 * @route POST /api/v1/documents/:id/forward
 * @access worker, officer
 */
router.post('/:id/forward', authMiddleware, rbacMiddleware('worker', 'officer'), documentController.forwardDocument);

module.exports = router;

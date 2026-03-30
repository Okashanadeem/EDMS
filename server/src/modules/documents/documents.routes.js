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
 * @access super_admin
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin'), documentController.listAllDocuments);

/**
 * @route GET /api/v1/documents/mine
 * @access worker
 */
router.get('/mine', authMiddleware, rbacMiddleware('worker'), documentController.getMyDocuments);

/**
 * @route GET /api/v1/documents/inbox
 * @access worker
 */
router.get('/inbox', authMiddleware, rbacMiddleware('worker'), documentController.getInbox);

/**
 * @route GET /api/v1/documents/:id
 * @access authenticated
 */
router.get('/:id', authMiddleware, documentController.getDocumentDetail);

/**
 * @route POST /api/v1/documents
 * @access worker
 */
router.post('/', authMiddleware, rbacMiddleware('worker'), upload.single('file'), documentController.createDocument);

/**
 * @route POST /api/v1/documents/:id/pickup
 * @access worker
 */
router.post('/:id/pickup', authMiddleware, rbacMiddleware('worker'), documentController.pickupDocument);

/**
 * @route POST /api/v1/documents/:id/start
 * @access worker
 */
router.post('/:id/start', authMiddleware, rbacMiddleware('worker'), documentController.startProcessing);

/**
 * @route POST /api/v1/documents/:id/complete
 * @access worker
 */
router.post('/:id/complete', authMiddleware, rbacMiddleware('worker'), documentController.completeDocument);

/**
 * @route POST /api/v1/documents/:id/forward
 * @access worker
 */
router.post('/:id/forward', authMiddleware, rbacMiddleware('worker'), documentController.forwardDocument);

module.exports = router;

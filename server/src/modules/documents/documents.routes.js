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
 * @route POST /api/v1/documents
 * @access worker
 */
router.post('/', authMiddleware, rbacMiddleware('worker'), upload.single('file'), documentController.createDocument);

/**
 * @route GET /api/v1/documents/inbox
 * @access worker
 */
router.get('/inbox', authMiddleware, rbacMiddleware('worker'), documentController.getInbox);

/**
 * @route POST /api/v1/documents/:id/pickup
 * @access worker
 */
router.post('/:id/pickup', authMiddleware, rbacMiddleware('worker'), documentController.pickupDocument);

module.exports = router;

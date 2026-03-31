const express = require('express');
const draftController = require('./drafts.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/drafts
 * @access worker, officer, assistant
 */
router.get('/', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), draftController.listDrafts);

/**
 * @route POST /api/v1/drafts
 * @access worker, officer, assistant
 */
router.post('/', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), draftController.createDraft);

/**
 * @route PATCH /api/v1/drafts/:id
 * @access worker, officer, assistant
 */
router.patch('/:id', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), draftController.updateDraft);

/**
 * @route DELETE /api/v1/drafts/:id
 * @access worker, officer, assistant
 */
router.delete('/:id', authMiddleware, rbacMiddleware('worker', 'officer', 'assistant'), draftController.deleteDraft);

/**
 * @route POST /api/v1/drafts/:id/submit
 * @access assistant
 */
router.post('/:id/submit', authMiddleware, rbacMiddleware('assistant'), draftController.submitDraft);

/**
 * @route POST /api/v1/drafts/:id/approve
 * @access officer
 */
router.post('/:id/approve', authMiddleware, rbacMiddleware('officer'), draftController.approveDraft);

/**
 * @route POST /api/v1/drafts/:id/revise
 * @access officer
 */
router.post('/:id/revise', authMiddleware, rbacMiddleware('officer'), draftController.reviseDraft);

module.exports = router;

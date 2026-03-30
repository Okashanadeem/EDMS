const express = require('express');
const auditController = require('./audit.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/audit
 * @access super_admin
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin'), auditController.listLogs);

module.exports = router;

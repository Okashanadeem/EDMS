const express = require('express');
const testController = require('./test.controller');

const router = express.Router();

/**
 * @route POST /api/v1/test/cleanup
 * @access Internal/Development
 */
router.post('/cleanup', testController.cleanup);

/**
 * @route POST /api/v1/test/cleanup/documents
 */
router.post('/cleanup/documents', testController.cleanupDocuments);

/**
 * @route POST /api/v1/test/cleanup/users
 */
router.post('/cleanup/users', testController.cleanupUsers);

/**
 * @route POST /api/v1/test/cleanup/departments
 */
router.post('/cleanup/departments', testController.cleanupDepartments);

/**
 * @route POST /api/v1/test/cleanup/logs
 */
router.post('/cleanup/logs', testController.cleanupLogs);

module.exports = router;

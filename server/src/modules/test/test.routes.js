const express = require('express');
const testController = require('./test.controller');

const router = express.Router();

/**
 * @route POST /api/v1/test/cleanup
 * @access Internal/Development
 */
router.post('/cleanup', testController.cleanup);

module.exports = router;

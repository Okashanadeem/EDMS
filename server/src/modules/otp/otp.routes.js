const express = require('express');
const otpController = require('./otp.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route POST /api/v1/otp/request
 * @access assistant
 */
router.post('/request', authMiddleware, rbacMiddleware('assistant'), otpController.requestOtp);

/**
 * @route POST /api/v1/otp/verify
 * @access assistant
 */
router.post('/verify', authMiddleware, rbacMiddleware('assistant'), otpController.verifyOtp);

module.exports = router;

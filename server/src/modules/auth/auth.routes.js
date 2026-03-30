const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/v1/auth/logout
 * @access Auth
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;

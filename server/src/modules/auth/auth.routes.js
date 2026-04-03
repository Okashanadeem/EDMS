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
 * @route GET /api/v1/auth/me
 * @access auth
 */
router.get('/me', authMiddleware, authController.getProfile);

/**
 * @route POST /api/v1/auth/logout
 * @access auth
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route PATCH /api/v1/auth/change-password
 * @access auth
 */
router.patch('/change-password', authMiddleware, authController.changePassword);

module.exports = router;

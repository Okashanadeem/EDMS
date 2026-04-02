const express = require('express');
const userController = require('./users.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/users/positions
 * @access authenticated
 */
router.get('/positions', authMiddleware, userController.listPositions);

/**
 * @route POST /api/v1/users/positions
 * @access super_admin
 */
router.post('/positions', authMiddleware, rbacMiddleware('super_admin'), userController.createPosition);

/**
 * @route PATCH /api/v1/users/positions/:id
 * @access super_admin
 */
router.patch('/positions/:id', authMiddleware, rbacMiddleware('super_admin'), userController.updatePosition);

/**
 * @route GET /api/v1/users
 * @access authenticated
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin', 'worker', 'officer', 'assistant'), userController.listUsers);

/**
 * @route PATCH /api/v1/users/profile
 * @access authenticated
 */
router.patch('/profile', authMiddleware, userController.updateProfile);

/**
 * @route POST /api/v1/users
 * @access super_admin
 */
router.post('/', authMiddleware, rbacMiddleware('super_admin'), userController.createUser);

/**
 * @route PATCH /api/v1/users/:id
 * @access super_admin
 */
router.patch('/:id', authMiddleware, rbacMiddleware('super_admin'), userController.updateUser);

/**
 * @route PATCH /api/v1/users/:id/reset-password
 * @access super_admin
 */
router.patch('/:id/reset-password', authMiddleware, rbacMiddleware('super_admin'), userController.resetPassword);

/**
 * @route DELETE /api/v1/users/:id
 * @access super_admin
 */
router.delete('/:id', authMiddleware, rbacMiddleware('super_admin'), userController.deleteUser);

module.exports = router;

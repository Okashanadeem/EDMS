const express = require('express');
const userController = require('./users.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/users
 * @access super_admin
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin'), userController.listUsers);

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

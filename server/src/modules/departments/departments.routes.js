const express = require('express');
const departmentController = require('./departments.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

/**
 * @route GET /api/v1/departments
 * @access super_admin
 */
router.get('/', authMiddleware, rbacMiddleware('super_admin'), departmentController.listDepartments);

/**
 * @route POST /api/v1/departments
 * @access super_admin
 */
router.post('/', authMiddleware, rbacMiddleware('super_admin'), departmentController.createDepartment);

/**
 * @route PATCH /api/v1/departments/:id
 * @access super_admin
 */
router.patch('/:id', authMiddleware, rbacMiddleware('super_admin'), departmentController.updateDepartment);

/**
 * @route DELETE /api/v1/departments/:id
 * @access super_admin
 */
router.delete('/:id', authMiddleware, rbacMiddleware('super_admin'), departmentController.deleteDepartment);

module.exports = router;

const express = require('express');
const multer = require('multer');
const userController = require('./users.controller');
const authMiddleware = require('../../middleware/auth');
const rbacMiddleware = require('../../middleware/rbac');

const router = express.Router();

// Multer for signature images
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Position Routes
router.get('/positions', authMiddleware, userController.listPositions);
router.post('/positions', authMiddleware, rbacMiddleware('super_admin'), userController.createPosition);
router.patch('/positions/:id', authMiddleware, rbacMiddleware('super_admin'), userController.updatePosition);

// User Routes
router.get('/', authMiddleware, userController.listUsers);
router.post('/', authMiddleware, rbacMiddleware('super_admin'), userController.createUser);
router.patch('/profile', authMiddleware, userController.updateProfile);
router.patch('/:id', authMiddleware, rbacMiddleware('super_admin'), userController.updateUser);
router.delete('/:id', authMiddleware, rbacMiddleware('super_admin'), userController.deleteUser);
router.post('/:id/reset-password', authMiddleware, rbacMiddleware('super_admin'), userController.resetPassword);

// Signature Route (Officer or Super Admin)
router.patch('/:id/signature', authMiddleware, upload.single('signature'), userController.uploadSignature);

module.exports = router;

/**
 * User Profile & Onboarding Routes
 */

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadDisk, handleUpload } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validateMiddleware');

// Validation Schemas
const changePasswordSchema = {
  currentPassword: { required: true },
  newPassword: { required: true, minLength: 6 }
};

// All profile & onboarding routes require authentication
router.use(authenticate);

// Profile endpoints
router.get('/', UserController.getProfile);
router.get('/profile', UserController.getProfile);
router.put('/', UserController.updateProfile);
router.put('/profile', UserController.updateProfile);

// Onboarding endpoint
router.post('/onboarding', UserController.saveOnboarding);

// Avatar & Security
router.post('/avatar', handleUpload(uploadDisk.single('avatar')), UserController.uploadAvatar);
router.put('/change-password', validate(changePasswordSchema), UserController.changePassword);

module.exports = router;


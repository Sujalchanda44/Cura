/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validateMiddleware');

// Validation Schemas
const registerSchema = {
  name: { required: true, minLength: 2, maxLength: 50 },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 }
};

const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true }
};

const refreshSchema = {
  refreshToken: { required: true }
};

const forgotPasswordSchema = {
  email: { required: true, type: 'email' }
};

const resetPasswordSchema = {
  token: { required: true },
  newPassword: { required: true, minLength: 6 }
};

// Endpoints
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/google', AuthController.googleAuth);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/refresh-token', validate(refreshSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);

module.exports = router;


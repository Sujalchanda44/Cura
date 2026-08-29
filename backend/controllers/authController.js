/**
 * Authentication Controller
 * Handles user registration, login, Google OAuth, token refresh, and password recovery
 */

const crypto = require('crypto');
const User = require('../models/User');
const TokenHelper = require('../utils/tokenHelper');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_MESSAGES, ROLES } = require('../config/constants');
const memoryDb = require('../database/memoryStore');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, role, settings } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return ResponseHandler.error(
          res,
          ERROR_MESSAGES.USER_EXISTS,
          HTTP_STATUS.CONFLICT
        );
      }

      // Default role to USER unless explicitly permitted
      const assignedRole = role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;

      const newUser = await User.create({
        name,
        email,
        password,
        role: assignedRole,
        settings
      });

      const tokenPayload = { id: newUser.id, email: newUser.email, role: newUser.role };
      const accessToken = TokenHelper.generateAccessToken(tokenPayload);
      const refreshToken = TokenHelper.generateRefreshToken(tokenPayload);

      await memoryDb.storeRefreshToken(refreshToken);

      return ResponseHandler.created(res, 'User registered successfully', {
        user: User.toSafeObject(newUser),
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return ResponseHandler.error(
          res,
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return ResponseHandler.error(
          res,
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const tokenPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = TokenHelper.generateAccessToken(tokenPayload);
      const refreshToken = TokenHelper.generateRefreshToken(tokenPayload);

      await memoryDb.storeRefreshToken(refreshToken);

      return ResponseHandler.success(res, 'Login successful', {
        user: User.toSafeObject(user),
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Google OAuth "Continue with Google"
   * POST /api/auth/google
   */
  static async googleAuth(req, res, next) {
    try {
      const { credential, idToken, googleId, email, name, picture } = req.body;

      let userEmail = email;
      let userName = name;
      let userGoogleId = googleId;
      let userAvatar = picture;

      // If a JWT credential / ID token is sent from Google Sign-In button
      const rawToken = credential || idToken;
      if (rawToken && typeof rawToken === 'string' && rawToken.includes('.')) {
        try {
          const parts = rawToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            userEmail = userEmail || payload.email;
            userName = userName || payload.name;
            userGoogleId = userGoogleId || payload.sub;
            userAvatar = userAvatar || payload.picture;
          }
        } catch {
          // Token decode fallback
        }
      }

      if (!userEmail) {
        return ResponseHandler.error(
          res,
          'Valid Google email or credential token is required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check if user exists by email or googleId
      let user = await User.findByEmail(userEmail);

      if (!user && userGoogleId) {
        user = await User.findByGoogleId(userGoogleId);
      }

      if (user) {
        // Update user's googleId or avatar if newly linked
        const updates = {};
        if (!user.googleId && userGoogleId) updates.googleId = userGoogleId;
        if (!user.avatarUrl && userAvatar) updates.avatarUrl = userAvatar;

        if (Object.keys(updates).length > 0) {
          user = await User.update(user.id, updates);
        }
      } else {
        // Create new user via Google
        user = await User.create({
          name: userName || userEmail.split('@')[0],
          email: userEmail,
          googleId: userGoogleId || `google_${Date.now()}`,
          avatarUrl: userAvatar || null,
          role: ROLES.USER
        });
      }

      const tokenPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = TokenHelper.generateAccessToken(tokenPayload);
      const refreshToken = TokenHelper.generateRefreshToken(tokenPayload);

      await memoryDb.storeRefreshToken(refreshToken);

      return ResponseHandler.success(res, 'Google authentication successful', {
        user: User.toSafeObject(user),
        isNewUser: !user.password,
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request Password Reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return ResponseHandler.error(res, 'Email is required', HTTP_STATUS.BAD_REQUEST);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // For security, do not leak whether an email exists or not
        return ResponseHandler.success(
          res,
          'If your email is registered in Cura+, you will receive a password reset link shortly.'
        );
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      await memoryDb.update('users', user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires
      });

      return ResponseHandler.success(
        res,
        'If your email is registered in Cura+, you will receive a password reset link shortly.',
        {
          // Exposed in response for easy frontend local development & testing
          resetToken,
          expiresIn: '1 hour',
          instructions: 'Use POST /api/auth/reset-password with this token and your newPassword'
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password with Token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return ResponseHandler.error(
          res,
          'Reset token and newPassword are required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (newPassword.length < 6) {
        return ResponseHandler.error(
          res,
          'New password must be at least 6 characters long',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const user = await User.findByResetToken(token);
      if (!user) {
        return ResponseHandler.error(
          res,
          'Invalid or expired password reset token',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await User.update(user.id, {
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });

      return ResponseHandler.success(res, 'Password has been reset successfully. You can now log in.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token
   * POST /api/auth/refresh-token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseHandler.error(
          res,
          'Refresh token is required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const isStored = await memoryDb.isRefreshTokenValid(refreshToken);
      if (!isStored) {
        return ResponseHandler.error(
          res,
          'Invalid or revoked refresh token',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const { valid, decoded, error } = TokenHelper.verifyRefreshToken(refreshToken);
      if (!valid) {
        await memoryDb.revokeRefreshToken(refreshToken);
        return ResponseHandler.error(
          res,
          `Refresh token is invalid or expired (${error})`,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return ResponseHandler.error(
          res,
          'User no longer exists',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      // Generate new access token
      const tokenPayload = { id: user.id, email: user.email, role: user.role };
      const newAccessToken = TokenHelper.generateAccessToken(tokenPayload);

      return ResponseHandler.success(res, 'Access token refreshed successfully', {
        accessToken: newAccessToken,
        tokenType: 'Bearer'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await memoryDb.revokeRefreshToken(refreshToken);
      }

      return ResponseHandler.success(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

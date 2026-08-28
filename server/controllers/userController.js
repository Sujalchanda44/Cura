/**
 * User Profile Controller
 * Handles user profile details, health onboarding, avatar uploads, and password modification
 */

const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

class UserController {
  /**
   * Get current user profile (with health profile & settings)
   * GET /api/user/profile or GET /api/profile
   */
  static async getProfile(req, res, next) {
    try {
      const [user, healthProfile] = await Promise.all([
        User.findById(req.user.id),
        HealthProfile.findByUserId(req.user.id)
      ]);

      if (!user) {
        return ResponseHandler.error(res, 'User not found', HTTP_STATUS.NOT_FOUND);
      }

      return ResponseHandler.success(res, 'Profile retrieved successfully', {
        ...User.toSafeObject(user),
        healthProfile: healthProfile || null,
        isOnboarded: !!healthProfile?.isOnboarded
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save onboarding health profile
   * POST /api/user/onboarding
   */
  static async saveOnboarding(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await HealthProfile.createOrUpdate(userId, req.body);

      // Update user name/settings if included
      if (req.body.name || req.body.settings) {
        await User.update(userId, {
          ...(req.body.name ? { name: req.body.name } : {}),
          ...(req.body.settings ? { settings: req.body.settings } : {})
        });
      }

      const updatedUser = await User.findById(userId);

      return ResponseHandler.success(res, 'Onboarding health profile saved successfully', {
        user: User.toSafeObject(updatedUser),
        healthProfile: profile,
        isOnboarded: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile details
   * PUT /api/user/profile or PUT /api/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, avatarUrl, settings } = req.body;
      const updated = await User.update(req.user.id, {
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(settings ? { settings } : {})
      });
      return ResponseHandler.success(res, 'Profile updated successfully', User.toSafeObject(updated));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload user avatar
   * POST /api/user/avatar or POST /api/profile/avatar
   */
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return ResponseHandler.error(res, 'No image file provided', HTTP_STATUS.BAD_REQUEST);
      }

      // Generate accessible path for uploaded avatar
      const avatarUrl = `/uploads/${req.file.filename}`;
      const updated = await User.update(req.user.id, { avatarUrl });

      return ResponseHandler.success(res, 'Avatar uploaded successfully', {
        avatarUrl,
        user: User.toSafeObject(updated)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * PUT /api/user/change-password or PUT /api/profile/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      const isMatch = await User.verifyPassword(currentPassword, user.password);

      if (!isMatch) {
        return ResponseHandler.error(res, 'Current password does not match', HTTP_STATUS.BAD_REQUEST);
      }

      await User.update(req.user.id, { password: newPassword });
      return ResponseHandler.success(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;


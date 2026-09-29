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

      const isOnboarded = !!healthProfile?.isOnboarded || 
                          !!user?.settings?.isOnboarded || 
                          (Number(healthProfile?.heightCm || 0) > 0 && Number(healthProfile?.weightKg || 0) > 0);

      return ResponseHandler.success(res, 'Profile retrieved successfully', {
        ...User.toSafeObject(user),
        healthProfile: healthProfile ? { ...healthProfile, isOnboarded } : null,
        isOnboarded
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
      const profile = await HealthProfile.createOrUpdate(userId, {
        ...req.body,
        isOnboarded: true
      });

      // Health metrics (steps, water, sleep, calories) should only be recorded
      // when the user explicitly logs daily metrics, not auto-seeded on onboarding.

      // Fetch current user settings to merge with isOnboarded flag
      const existingUser = await User.findById(userId);
      const existingSettings = (existingUser?.settings && typeof existingUser.settings === 'object') ? existingUser.settings : {};
      
      await User.update(userId, {
        ...(req.body.name ? { name: req.body.name } : {}),
        settings: {
          ...existingSettings,
          ...(req.body.settings || {}),
          isOnboarded: true
        }
      });

      const updatedUser = await User.findById(userId);

      return ResponseHandler.success(res, 'Onboarding health profile saved successfully', {
        user: { ...User.toSafeObject(updatedUser), isOnboarded: true },
        healthProfile: profile ? { ...profile, isOnboarded: true } : null,
        isOnboarded: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save partial onboarding draft for Save & Resume
   * POST /api/user/onboarding/draft
   */
  static async saveOnboardingDraft(req, res, next) {
    try {
      const userId = req.user.id;
      const draft = await HealthProfile.saveDraft(userId, req.body);
      return ResponseHandler.success(res, 'Onboarding progress saved successfully', draft);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get partial onboarding draft for Save & Resume
   * GET /api/user/onboarding/draft
   */
  static async getOnboardingDraft(req, res, next) {
    try {
      const userId = req.user.id;
      const draft = await HealthProfile.getDraft(userId);
      return ResponseHandler.success(res, 'Onboarding draft retrieved successfully', draft);
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
        ...(name !== undefined ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
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
      let avatarUrl = null;

      if (req.file) {
        avatarUrl = `/uploads/${req.file.filename}`;
      } else if (req.body?.avatarBase64) {
        // Base64 upload fallback
        const fs = require('fs');
        const path = require('path');
        const matches = req.body.avatarBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        const uploadDir = path.resolve(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const ext = matches ? (matches[1] === 'jpeg' ? 'jpg' : matches[1]) : 'png';
        const rawData = matches ? matches[2] : req.body.avatarBase64;
        const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, Buffer.from(rawData, 'base64'));
        avatarUrl = `/uploads/${filename}`;
      } else {
        return ResponseHandler.error(res, 'No image file or image data provided', HTTP_STATUS.BAD_REQUEST);
      }

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
   * Delete / reset user avatar
   * DELETE /api/user/avatar
   */
  static async deleteAvatar(req, res, next) {
    try {
      const updated = await User.update(req.user.id, { avatarUrl: null });
      return ResponseHandler.success(res, 'Avatar removed successfully', {
        avatarUrl: null,
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


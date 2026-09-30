/**
 * User Profile Controller
 * Handles user profile details, health onboarding, avatar uploads, and password modification
 */

const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const SupabaseStorageService = require('../services/supabaseStorageService');
const logger = require('../utils/logger');

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
          ...(req.body.language ? { language: req.body.language } : {}),
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
   * Upload user avatar / DP to Supabase Storage
   * POST /api/user/avatar or POST /api/profile/avatar
   */
  static async uploadAvatar(req, res, next) {
    try {
      let avatarUrl = null;

      if (req.file) {
        // Upload from in-memory multipart file buffer directly to Supabase Storage
        const uploadResult = await SupabaseStorageService.uploadFile(req.file, {
          folder: 'avatars',
          userId: req.user.id,
          prefix: 'avatar'
        });
        avatarUrl = uploadResult.publicUrl;
      } else if (req.body?.avatarBase64) {
        // Upload base64 image data directly to Supabase Storage
        const uploadResult = await SupabaseStorageService.uploadBase64(req.body.avatarBase64, {
          folder: 'avatars',
          userId: req.user.id,
          prefix: 'avatar'
        });
        avatarUrl = uploadResult.publicUrl;
      } else {
        return ResponseHandler.error(res, 'No image file or image data provided', HTTP_STATUS.BAD_REQUEST);
      }

      // Check for previous avatar to clean up in cloud storage
      try {
        const previousUser = await User.findById(req.user.id);
        if (previousUser?.avatarUrl && previousUser.avatarUrl.includes('/storage/v1/object/public/')) {
          await SupabaseStorageService.deleteFile(previousUser.avatarUrl);
        }
      } catch (cleanErr) {
        logger.warn('Failed to clean up old avatar from cloud storage:', cleanErr.message);
      }

      const updated = await User.update(req.user.id, { avatarUrl });

      return ResponseHandler.success(res, 'Avatar uploaded successfully to Supabase Storage', {
        avatarUrl,
        user: User.toSafeObject(updated)
      });
    } catch (error) {
      logger.error('Error uploading avatar to Supabase:', error);
      next(error);
    }
  }

  /**
   * Delete / reset user avatar
   * DELETE /api/user/avatar
   */
  static async deleteAvatar(req, res, next) {
    try {
      // Clean up file in Supabase Storage if it was uploaded there
      try {
        const currentUser = await User.findById(req.user.id);
        if (currentUser?.avatarUrl && currentUser.avatarUrl.includes('/storage/v1/object/public/')) {
          await SupabaseStorageService.deleteFile(currentUser.avatarUrl);
        }
      } catch (cleanErr) {
        logger.warn('Failed to delete avatar from Supabase Storage:', cleanErr.message);
      }

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


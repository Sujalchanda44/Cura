/**
 * Health Profile Controller
 * Handles user biometric profile, dietary restrictions, and calculated metabolic targets
 */

const HealthProfile = require('../models/HealthProfile');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

class HealthProfileController {
  /**
   * Create or update health profile
   * POST /api/health-profile or PUT /api/health-profile
   */
  static async saveProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await HealthProfile.createOrUpdate(userId, req.body);
      return ResponseHandler.success(res, 'Health profile saved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's health profile
   * GET /api/health-profile
   */
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await HealthProfile.findByUserId(userId);

      if (!profile) {
        return ResponseHandler.error(
          res,
          'Health profile not found. Please create one to calculate your targets.',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHandler.success(res, 'Health profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user's health profile
   * DELETE /api/health-profile
   */
  static async deleteProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const deleted = await HealthProfile.deleteByUserId(userId);

      if (!deleted) {
        return ResponseHandler.error(res, 'No health profile found to delete', HTTP_STATUS.NOT_FOUND);
      }

      return ResponseHandler.success(res, 'Health profile deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HealthProfileController;

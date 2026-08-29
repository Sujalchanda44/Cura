/**
 * Recommendation Controller
 * Handles food and meal suggestions tailored to user's health goals and allergies
 */

const RecommendationService = require('../services/recommendationService');
const HealthProfile = require('../models/HealthProfile');
const ResponseHandler = require('../utils/responseHandler');

class RecommendationController {
  /**
   * Get personalized food & recipe recommendations
   * GET /api/recommendations
   */
  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const { mealType } = req.query;

      const profile = await HealthProfile.findByUserId(userId);
      const recommendations = RecommendationService.getRecommendations(profile, { mealType });

      return ResponseHandler.success(res, 'Personalized food recommendations retrieved', recommendations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate custom AI meal plan recommendation
   * POST /api/recommendations/custom
   */
  static async getCustomRecommendation(req, res, next) {
    try {
      const userId = req.user.id;
      const { mealType, targetCalories } = req.body;

      const profile = await HealthProfile.findByUserId(userId);
      const customPlan = await RecommendationService.getCustomAIRecommendation(profile, {
        mealType: mealType || 'lunch',
        targetCalories: targetCalories || 500
      });

      return ResponseHandler.success(res, 'Custom meal recommendation generated', customPlan);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RecommendationController;

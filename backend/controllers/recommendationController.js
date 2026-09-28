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
   * Generate AI-personalized suggestions (Triggered by AI Suggest button)
   * POST /api/recommendations/ai-suggest
   */
  static async getAISuggestions(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await HealthProfile.findByUserId(userId);
      const suggestions = await RecommendationService.getAISuggestions(profile);

      return ResponseHandler.success(res, 'AI suggestions generated successfully', suggestions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log a recommended meal to user's daily NutritionLog
   * POST /api/recommendations/log-meal
   */
  static async logMeal(req, res, next) {
    try {
      const userId = req.user.id;
      const mealData = req.body;

      if (!mealData || !mealData.name) {
        return ResponseHandler.error(res, 'Meal details are required to log', 400);
      }

      const logged = await RecommendationService.logMeal(userId, mealData);
      return ResponseHandler.success(res, 'Meal logged successfully to daily nutrition tracker', logged);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of meals logged today by this user
   * GET /api/recommendations/logged-today
   */
  static async getLoggedMealsToday(req, res, next) {
    try {
      const userId = req.user.id;
      const logs = await RecommendationService.getLoggedMealsToday(userId);
      return ResponseHandler.success(res, 'Logged meals retrieved', {
        todayLogs: logs,
        loggedMealNames: (logs || []).map(l => (l.name || '').toLowerCase().trim()),
        loggedMealIds: (logs || []).map(l => l.id)
      });
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

/**
 * AI Assistant Controller
 * Powered by Google Gemini AI
 */

const GeminiService = require('../services/geminiService');
const HealthProfile = require('../models/HealthProfile');
const HealthMetric = require('../models/HealthMetric');
const NutritionLog = require('../models/NutritionLog');
const HealthScoreService = require('../services/healthScoreService');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

class AIController {
  /**
   * Conversational Chat with Gemini
   * POST /api/ai/chat
   */
  static async chat(req, res, next) {
    try {
      const { message } = req.body;

      if (!message || message.trim() === '') {
        return ResponseHandler.error(res, 'Message text is required', HTTP_STATUS.BAD_REQUEST);
      }

      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Gather rich context for the AI prompt
      const [profile, todayMetrics, recentLogs] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getByDate(userId, today),
        NutritionLog.findByUserAndDate(userId, today)
      ]);

      const response = await GeminiService.chat(message, {
        name: req.user.name,
        healthProfile: profile,
        todayMetrics,
        recentLogs
      });

      return ResponseHandler.success(res, 'AI response received', {
        userMessage: message,
        aiResponse: response.reply,
        model: response.model,
        source: response.source
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Personalized Health Advice
   * GET /api/ai/health-advice
   */
  static async getHealthAdvice(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const [profile, metrics, nutritionTotals] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getByDate(userId, today),
        NutritionLog.getDailyTotals(userId, today)
      ]);

      const scoreData = HealthScoreService.calculateDailyScore(profile, nutritionTotals, metrics);
      const advice = await GeminiService.getHealthAdvice(profile, metrics, scoreData.overallScore);

      return ResponseHandler.success(res, 'Personalized health advice generated', {
        advice,
        currentHealthScore: scoreData.overallScore,
        status: scoreData.status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Tailored Meal Recommendations
   * POST /api/ai/meal-recommendation
   */
  static async getMealRecommendation(req, res, next) {
    try {
      const userId = req.user.id;
      const { mealType, targetCalories } = req.body;

      const profile = await HealthProfile.findByUserId(userId);
      const recommendation = await GeminiService.getMealRecommendation(
        profile,
        targetCalories || 550,
        mealType || 'lunch'
      );

      return ResponseHandler.success(res, 'Meal recommendation generated', recommendation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * AI Goal Proximity & Past Data Analysis
   * Evaluates user past tracking and biometrics to determine proximity to goal
   * GET or POST /api/ai/goal-analysis
   */
  static async analyzeGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 14);

      const startDateStr = pastDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      const [profile, historicalMetrics, nutritionTotals] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getRange(userId, startDateStr, endDateStr),
        NutritionLog.findByUserDateRange(userId, startDateStr, endDateStr)
      ]);

      const goalOptions = {
        ...(req.body || {}),
        ...(req.query || {})
      };

      const analysis = await GeminiService.analyzeGoalProgress(
        {
          ...(profile || {}),
          name: req.user.name
        },
        historicalMetrics,
        nutritionTotals,
        goalOptions
      );

      return ResponseHandler.success(res, 'Goal proximity analysis generated successfully', analysis);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;

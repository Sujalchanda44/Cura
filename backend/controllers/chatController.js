/**
 * AI Chatbot Controller
 * Handles conversation with LLM with user health profile and allergen context injection
 */

const GeminiService = require('../services/geminiService');
const HealthProfile = require('../models/HealthProfile');
const HealthMetric = require('../models/HealthMetric');
const NutritionLog = require('../models/NutritionLog');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

class ChatController {
  /**
   * Send Message to AI Health Coach
   * POST /api/chat/message
   */
  static async sendMessage(req, res, next) {
    try {
      const message = req.body.message || req.body.prompt || req.body.text;

      if (!message || message.trim() === '') {
        return ResponseHandler.error(res, 'Message text is required', HTTP_STATUS.BAD_REQUEST);
      }

      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Gather rich contextual data from health profile, daily metrics, and food logs
      const [profile, todayMetrics, recentLogs] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getByDate(userId, today),
        NutritionLog.findByUserAndDate(userId, today)
      ]);

      const aiResponse = await GeminiService.chat(message, {
        name: req.user.name,
        healthProfile: profile,
        todayMetrics,
        recentLogs
      });

      return ResponseHandler.success(res, 'AI response generated successfully', {
        userMessage: message,
        reply: aiResponse.reply,
        aiResponse: aiResponse.reply,
        model: aiResponse.model,
        source: aiResponse.source,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ChatController;

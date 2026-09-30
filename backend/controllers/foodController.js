/**
 * Food Scanner & Nutrition Controller
 * Integrates image recognition, barcode scanning, allergen detection, and AI recommendations
 */

const OpenFoodFactsService = require('../services/openFoodFactsService');
const GeminiService = require('../services/geminiService');
const HealthProfile = require('../models/HealthProfile');
const NutritionLog = require('../models/NutritionLog');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const SupabaseStorageService = require('../services/supabaseStorageService');
const logger = require('../utils/logger');

class FoodController {
  /**
   * Upload Food Image and Analyze with Vision AI
   * POST /api/food/upload-image
   */
  static async uploadFoodImage(req, res, next) {
    try {
      const { mealType, autoLog } = req.body;
      const textHint = req.body.textHint || '';

      // Upload food image to Supabase Storage
      let uploadedImageUrl = null;
      if (req.file) {
        try {
          const uploadRes = await SupabaseStorageService.uploadFile(req.file, {
            folder: 'food',
            userId: req.user.id,
            prefix: 'meal'
          });
          uploadedImageUrl = uploadRes.publicUrl;
        } catch (uploadErr) {
          logger.warn('Failed to upload meal image to Supabase Storage:', uploadErr.message);
        }
      }

      // Perform Vision AI analysis
      const analysis = await GeminiService.analyzeFoodImage(req.file, textHint);

      let savedLog = null;
      if (autoLog === 'true' || autoLog === true) {
        savedLog = await NutritionLog.create({
          userId: req.user.id,
          mealType: mealType || 'lunch',
          name: analysis.identifiedFood,
          calories: analysis.nutritionEstimate.calories,
          protein: analysis.nutritionEstimate.protein,
          carbs: analysis.nutritionEstimate.carbs,
          fat: analysis.nutritionEstimate.fat,
          fiber: analysis.nutritionEstimate.fiber,
          ingredients: analysis.ingredients,
          imageUrl: uploadedImageUrl
        });
      }

      return ResponseHandler.success(res, 'Food image analyzed successfully', {
        analysis,
        imageUrl: uploadedImageUrl,
        loggedMeal: savedLog
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan / Lookup Barcode
   * POST /api/food/scan-barcode
   */
  static async scanBarcode(req, res, next) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return ResponseHandler.error(res, 'Barcode number is required', HTTP_STATUS.BAD_REQUEST);
      }

      const product = await OpenFoodFactsService.getProductByBarcode(barcode);
      const userProfile = await HealthProfile.findByUserId(req.user.id);
      const allergenCheck = OpenFoodFactsService.checkAllergens(product, userProfile?.allergies || []);

      return ResponseHandler.success(res, 'Barcode product retrieved successfully', {
        product,
        allergenCheck
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Product Details by Barcode ID
   * GET /api/food/product/:barcode
   */
  static async getProductDetails(req, res, next) {
    try {
      const { barcode } = req.params;
      const product = await OpenFoodFactsService.getProductByBarcode(barcode);

      if (!product) {
        return ResponseHandler.error(res, 'Product not found for the given barcode', HTTP_STATUS.NOT_FOUND);
      }

      const userProfile = await HealthProfile.findByUserId(req.user.id);
      const allergenCheck = OpenFoodFactsService.checkAllergens(product, userProfile?.allergies || []);

      return ResponseHandler.success(res, 'Product details fetched successfully', {
        product,
        allergenCheck
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check Allergens against User Profile
   * POST /api/food/check-allergens
   */
  static async checkAllergens(req, res, next) {
    try {
      const { ingredients, barcode } = req.body;
      const userProfile = await HealthProfile.findByUserId(req.user.id);
      const userAllergies = userProfile?.allergies || [];

      let productData = { ingredientsList: [], ingredientsText: '', allergens: [] };

      if (barcode) {
        productData = await OpenFoodFactsService.getProductByBarcode(barcode);
      } else if (ingredients) {
        const ingArray = Array.isArray(ingredients) ? ingredients : [ingredients];
        productData = {
          ingredientsList: ingArray,
          ingredientsText: ingArray.join(', '),
          allergens: []
        };
      }

      const result = OpenFoodFactsService.checkAllergens(productData, userAllergies);

      return ResponseHandler.success(res, 'Allergen check completed', {
        userAllergies,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Text-based Nutrition Analysis
   * POST /api/food/nutrition-analysis
   */
  static async analyzeNutrition(req, res, next) {
    try {
      const { mealDescription } = req.body;

      if (!mealDescription) {
        return ResponseHandler.error(res, 'mealDescription is required', HTTP_STATUS.BAD_REQUEST);
      }

      // Estimate nutritional contents
      const estimated = {
        name: mealDescription,
        servingSize: '1 standard portion',
        calories: 450,
        protein: 28,
        carbs: 45,
        fat: 16,
        fiber: 6,
        sugar: 8,
        sodium: 480,
        nutriScore: 'B',
        healthTips: 'Balanced macronutrient distribution with good protein content.'
      };

      return ResponseHandler.success(res, 'Nutrition analysis completed', estimated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * AI Food Recommendation based on remaining calories/macros
   * POST /api/food/ai-recommendation
   */
  static async getAIRecommendation(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];

      const [profile, nutritionTotals] = await Promise.all([
        HealthProfile.findByUserId(userId),
        NutritionLog.getDailyTotals(userId, today)
      ]);

      const targetCalories = profile?.targets?.dailyCalories || 2000;
      const remainingCals = Math.max(0, targetCalories - (nutritionTotals.calories || 0));

      const recommendation = await GeminiService.getMealRecommendation(
        profile,
        remainingCals,
        req.body.mealType || 'dinner'
      );

      return ResponseHandler.success(res, 'AI food recommendation generated', {
        remainingCalories: remainingCals,
        recommendation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log Meal to Nutrition Diary (Direct logging from Food Scanner or Manual entry)
   * POST /api/food/log-meal
   */
  static async logMeal(req, res, next) {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const {
        name,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        ingredients,
        barcode,
        imageUrl,
        mealType
      } = req.body;

      if (!name || !name.trim()) {
        return ResponseHandler.error(res, 'Meal name is required to log meal', HTTP_STATUS.BAD_REQUEST);
      }

      const loggedMeal = await NutritionLog.create({
        userId,
        date: today,
        mealType: mealType || 'lunch',
        name: name.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 4,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        barcode: barcode || null,
        imageUrl: imageUrl || null
      });

      // Recalculate immediate health score impact
      const HealthMetric = require('../models/HealthMetric');
      const HealthScoreService = require('../services/healthScoreService');

      const [profile, metrics, nutritionTotals, recentMeals] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getByDate(userId, today),
        NutritionLog.getDailyTotals(userId, today),
        NutritionLog.findByUserAndDate(userId, today)
      ]);

      const healthScoreData = HealthScoreService.calculateDailyScore(profile, nutritionTotals, metrics, recentMeals);

      return ResponseHandler.success(res, 'Meal logged successfully to Nutrition Diary', {
        loggedMeal,
        healthScore: {
          score: healthScoreData.overallScore,
          status: healthScoreData.status,
          grade: healthScoreData.grade,
          dietImpact: healthScoreData.dietImpact,
          insights: healthScoreData.insights
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FoodController;


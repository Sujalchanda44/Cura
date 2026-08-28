/**
 * Smart Scanner Controller
 * Unified endpoint for Barcode Scanning (OpenFoodFacts) and Food Image Recognition (Computer Vision)
 */

const OpenFoodFactsService = require('../services/openFoodFactsService');
const GeminiService = require('../services/geminiService');
const HealthProfile = require('../models/HealthProfile');
const NutritionLog = require('../models/NutritionLog');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');

class ScannerController {
  /**
   * Universal Food Scanner Analyzer
   * POST /api/scanner/analyze
   * Accepts: { barcode } OR multipart image file OR { imageBase64 } OR { textHint }
   */
  static async analyze(req, res, next) {
    try {
      const { barcode, imageBase64, textHint, mealType, autoLog } = req.body;
      const file = req.file;

      const userProfile = await HealthProfile.findByUserId(req.user.id);
      const userAllergies = userProfile?.allergies || [];

      let result = null;
      let scanType = 'unknown';

      // 1. If Barcode is supplied
      if (barcode) {
        scanType = 'barcode';
        const product = await OpenFoodFactsService.getProductByBarcode(barcode);
        const allergenCheck = OpenFoodFactsService.checkAllergens(product, userAllergies);

        result = {
          scanType,
          foodName: product.productName,
          brand: product.brand,
          barcode: product.barcode,
          nutriScore: product.nutriScore,
          servingSize: product.servingSize,
          nutritionalBreakdown: product.nutritionPer100g,
          ingredients: product.ingredientsList,
          ingredientsText: product.ingredientsText,
          allergenCheck,
          imageUrl: product.imageUrl,
          safetyStatus: allergenCheck.safeToConsume ? 'SAFE' : 'ALLERGEN_WARNING'
        };
      }
      // 2. If Image or Base64 is supplied
      else if (file || imageBase64 || textHint) {
        scanType = 'image_vision';
        const visionAnalysis = await GeminiService.analyzeFoodImage(file, textHint, imageBase64);
        
        // Check allergens for vision detected ingredients
        const allergenCheck = OpenFoodFactsService.checkAllergens(
          {
            ingredientsText: visionAnalysis.ingredients?.join(', ') || '',
            ingredientsList: visionAnalysis.ingredients || [],
            allergens: visionAnalysis.allergensDetected || []
          },
          userAllergies
        );

        result = {
          scanType,
          foodName: visionAnalysis.identifiedFood,
          confidence: visionAnalysis.confidence,
          servingSize: visionAnalysis.estimatedServingSize,
          nutritionalBreakdown: visionAnalysis.nutritionEstimate,
          ingredients: visionAnalysis.ingredients,
          allergenCheck,
          healthInsights: visionAnalysis.healthInsights,
          imageUrl: file ? `/uploads/${file.filename}` : null,
          safetyStatus: allergenCheck.safeToConsume ? 'SAFE' : 'ALLERGEN_WARNING'
        };
      } else {
        return ResponseHandler.error(
          res,
          'Please provide a barcode, food photo image, or imageBase64 to analyze.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // 3. Optional Auto-logging to Food Log
      let loggedMeal = null;
      if (autoLog === true || autoLog === 'true') {
        loggedMeal = await NutritionLog.create({
          userId: req.user.id,
          mealType: mealType || 'lunch',
          name: result.foodName,
          calories: result.nutritionalBreakdown.calories || 0,
          protein: result.nutritionalBreakdown.protein || 0,
          carbs: result.nutritionalBreakdown.carbs || 0,
          fat: result.nutritionalBreakdown.fat || 0,
          fiber: result.nutritionalBreakdown.fiber || 0,
          ingredients: result.ingredients || [],
          barcode: result.barcode || null,
          imageUrl: result.imageUrl || null
        });
      }

      return ResponseHandler.success(res, 'Food analysis completed successfully', {
        ...result,
        loggedMeal
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScannerController;

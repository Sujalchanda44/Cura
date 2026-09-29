/**
 * Smart Scanner Controller
 * Personalized Food & Allergy Safety Scanner
 * Integrates Multimodal Vision AI, Barcode Scanner, and Authenticated User Health Profile
 */

const OpenFoodFactsService = require('../services/openFoodFactsService');
const GeminiService = require('../services/geminiService');
const FoodAnalysisGateway = require('../services/foodAnalysisGateway');
const AllergySafetyEngine = require('../services/allergySafetyEngine');
const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');
const NutritionLog = require('../models/NutritionLog');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

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
      const userId = req.user.id;

      // 1. Retrieve the currently authenticated user's stored health profile
      const userRecord = await User.findById(userId);
      const healthProfile = await HealthProfile.findByUserId(userId);

      const onboardingData = healthProfile?.settings?.onboardingData || userRecord?.settings?.onboardingData || {};

      // Consolidate complete health profile for personalized clinical evaluation
      const userHealthContext = {
        name: userRecord?.name || req.user.name || 'User',
        allergies: healthProfile?.allergies?.length ? healthProfile.allergies : (onboardingData.allergies || []),
        structuredAllergies: healthProfile?.structuredAllergies || onboardingData.structuredAllergies || {},
        foodIntolerances: healthProfile?.foodIntolerances || onboardingData.foodIntolerances || [],
        medicalConditions: healthProfile?.medicalConditions?.length ? healthProfile.medicalConditions : (onboardingData.medicalConditions || []),
        dietType: healthProfile?.dietType || onboardingData.dietType || 'balanced',
        dietaryRestrictions: healthProfile?.dietaryRestrictions || onboardingData.dietaryRestrictions || [],
        age: healthProfile?.age || onboardingData.age || 25,
        gender: healthProfile?.gender || onboardingData.gender || 'not specified',
        heightCm: healthProfile?.heightCm || onboardingData.heightCm || 170,
        weightKg: healthProfile?.weightKg || onboardingData.weightKg || 70,
        medications: healthProfile?.medications || onboardingData.medications || '',
        healthGoals: healthProfile?.healthGoals || onboardingData.healthGoals || ['general_wellness']
      };

      let result = null;
      let scanType = 'unknown';

      // 2. Barcode Scanning Pipeline
      if (barcode) {
        scanType = 'barcode';
        const product = await OpenFoodFactsService.getProductByBarcode(barcode);

        const safetyEvaluation = AllergySafetyEngine.evaluatePersonalizedSafety(
          {
            foodName: product.productName,
            ingredients: product.ingredientsList || [],
            ingredientsText: product.ingredientsText || '',
            nutrition: {
              calories: product.nutritionPer100g?.calories || 0,
              protein: product.nutritionPer100g?.protein || 0,
              carbohydrates: product.nutritionPer100g?.carbs || 0,
              sugar: product.nutritionPer100g?.sugar || 0,
              fat: product.nutritionPer100g?.fat || 0,
              sodium: product.nutritionPer100g?.sodium || 0,
            }
          },
          userHealthContext
        );

        result = {
          scanType,
          foodName: product.productName,
          brand: product.brand,
          barcode: product.barcode,
          nutriScore: product.nutriScore,
          servingSize: product.servingSize || 'Per 100g',
          isPackagedProduct: true,
          isUnknownFood: false,
          confidence: 0.98,
          provider: 'barcode (openfoodfacts)',
          isFallbackMode: false,
          isLimitedAnalysis: false,
          detectedIngredients: product.ingredientsList || [],
          ingredientsText: product.ingredientsText || '',
          possibleAllergens: product.allergens || [],
          nutrition: {
            calories: product.nutritionPer100g?.calories || 0,
            protein: product.nutritionPer100g?.protein || 0,
            carbohydrates: product.nutritionPer100g?.carbs || 0,
            sugar: product.nutritionPer100g?.sugar || 0,
            fat: product.nutritionPer100g?.fat || 0,
            sodium: product.nutritionPer100g?.sodium || 0,
          },
          nutritionalBreakdown: product.nutritionPer100g,
          riskLevel: safetyEvaluation.riskLevel,
          riskReasons: safetyEvaluation.riskReasons,
          matchedUserAllergies: safetyEvaluation.matchedUserAllergies,
          matchedIntolerances: safetyEvaluation.matchedIntolerances,
          healthConcerns: safetyEvaluation.healthConcerns,
          profileChecks: safetyEvaluation.profileChecks,
          recommendation: safetyEvaluation.recommendation,
          alternativeSuggestion: safetyEvaluation.alternativeSuggestion,
          imageUrl: product.imageUrl,
          labelVerificationRequired: true,
          safetyStatus: safetyEvaluation.riskLevel === 'HIGH' ? 'ALLERGEN_WARNING' : 'SAFE'
        };
      }
      // 3. Multimodal Vision Pipeline via AI Gateway (Primary -> Secondary -> Emergency Fallback)
      else if (file || imageBase64 || textHint) {
        scanType = 'image_vision';
        const visionAnalysis = await FoodAnalysisGateway.analyzeFoodImage(
          file,
          userHealthContext,
          textHint,
          imageBase64
        );

        result = {
          scanType,
          foodName: visionAnalysis.foodName,
          brand: visionAnalysis.brand || (visionAnalysis.isPackagedProduct ? 'Packaged Product' : 'Fresh Meal / Dish'),
          confidence: visionAnalysis.confidence,
          servingSize: visionAnalysis.servingSize,
          isPackagedProduct: visionAnalysis.isPackagedProduct,
          isUnknownFood: visionAnalysis.isUnknownFood,
          provider: visionAnalysis.provider || 'primary-ai',
          isFallbackMode: Boolean(visionAnalysis.isFallbackMode),
          isLimitedAnalysis: Boolean(visionAnalysis.isLimitedAnalysis),
          detectedIngredients: visionAnalysis.detectedIngredients,
          ingredients: visionAnalysis.detectedIngredients,
          possibleAllergens: visionAnalysis.possibleAllergens,
          nutrition: visionAnalysis.nutrition,
          nutritionalBreakdown: {
            calories: visionAnalysis.nutrition?.calories || 0,
            protein: visionAnalysis.nutrition?.protein || 0,
            carbs: visionAnalysis.nutrition?.carbohydrates || 0,
            sugar: visionAnalysis.nutrition?.sugar || 0,
            fat: visionAnalysis.nutrition?.fat || 0,
            sodium: visionAnalysis.nutrition?.sodium || 0,
            fiber: 4
          },
          riskLevel: visionAnalysis.riskLevel,
          riskReasons: visionAnalysis.riskReasons,
          matchedUserAllergies: visionAnalysis.matchedUserAllergies,
          matchedIntolerances: visionAnalysis.matchedIntolerances,
          healthConcerns: visionAnalysis.healthConcerns,
          profileChecks: visionAnalysis.profileChecks,
          recommendation: visionAnalysis.recommendation,
          alternativeSuggestion: visionAnalysis.alternativeSuggestion,
          uncertainIngredients: visionAnalysis.uncertainIngredients || [],
          labelVerificationRequired: visionAnalysis.labelVerificationRequired,
          imageUrl: file ? `/uploads/${file.filename}` : null,
          safetyStatus: visionAnalysis.riskLevel === 'HIGH' ? 'ALLERGEN_WARNING' : 'SAFE'
        };
      } else {
        return ResponseHandler.error(
          res,
          'Please provide a food photo (JPEG, PNG, WebP) or barcode to analyze.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Attach simplified presentation fields (Food Health Score, short verdict, etc.)
      const scoreData = AllergySafetyEngine.computeFoodHealthScore(
        {
          foodName: result.foodName,
          ingredients: result.detectedIngredients,
          nutrition: result.nutrition
        },
        result,
        userHealthContext
      );

      result.healthScore = scoreData.healthScore;
      result.status = scoreData.status;
      result.shortVerdict = scoreData.shortVerdict;
      result.mainConcern = scoreData.mainConcern;
      result.betterChoice = scoreData.betterChoice;
      result.energyImpact = scoreData.energyImpact;
      result.allergyConflict = scoreData.allergyConflict;
      result.allergyName = scoreData.allergyName;
      result.detailedAnalysis = scoreData.detailedAnalysis;

      // 4. Attach Summary of User Health Context Checked
      result.userProfileSummary = {
        registeredAllergies: userHealthContext.allergies,
        medicalConditions: userHealthContext.medicalConditions,
        dietType: userHealthContext.dietType
      };

      // 5. Optional Auto-logging to Food Log
      let loggedMeal = null;
      if (autoLog === true || autoLog === 'true') {
        loggedMeal = await NutritionLog.create({
          userId: req.user.id,
          mealType: mealType || 'lunch',
          name: result.foodName,
          calories: result.nutrition?.calories || 0,
          protein: result.nutrition?.protein || 0,
          carbs: result.nutrition?.carbohydrates || 0,
          fat: result.nutrition?.fat || 0,
          fiber: 4,
          ingredients: result.detectedIngredients || [],
          barcode: result.barcode || null,
          imageUrl: result.imageUrl || null
        });
      }

      return ResponseHandler.success(res, 'Food analysis completed successfully', {
        ...result,
        loggedMeal
      });
    } catch (error) {
      logger.error('ScannerController.analyze error:', error);
      next(error);
    }
  }
}

module.exports = ScannerController;

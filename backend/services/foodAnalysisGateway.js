/**
 * Food Analysis AI Gateway
 * Manages Primary AI (Gemini), Secondary AI (Groq / OpenAI Vision), and Emergency Local Fallback.
 * Ensures that temporary outages, rate limits, or timeouts never cause the food scanner to fail.
 */

const fs = require('fs');
const logger = require('../utils/logger');
const GeminiService = require('./geminiService');
const SecondaryAiService = require('./secondaryAiService');
const AllergySafetyEngine = require('./allergySafetyEngine');

class FoodAnalysisGateway {
  /**
   * Helper: extract base64 data and mimeType from fileMeta or raw base64 string
   */
  static _extractBase64(fileMeta, rawBase64 = null) {
    if (rawBase64) {
      const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
      return { mimeType: 'image/jpeg', base64: rawBase64 };
    }

    if (fileMeta && fileMeta.path) {
      try {
        const buffer = fs.readFileSync(fileMeta.path);
        return {
          mimeType: fileMeta.mimetype || 'image/jpeg',
          base64: buffer.toString('base64')
        };
      } catch (err) {
        logger.error('Failed to read file path for vision base64 extraction:', err.message);
      }
    }

    if (fileMeta && fileMeta.buffer) {
      return {
        mimeType: fileMeta.mimetype || 'image/jpeg',
        base64: fileMeta.buffer.toString('base64')
      };
    }

    return null;
  }

  /**
   * Emergency Deterministic Fallback Analyzer
   * Activated when both Primary and Secondary AI providers fail or are offline
   */
  static _runEmergencyLocalFallback(userHealthContext = {}, textHint = '', filename = '') {
    logger.warn('[FoodScanner] Emergency local fallback activated');

    const cue = (textHint || filename || '').toLowerCase();

    // Check if filename or text hint gives identifiable meal context
    let foodName = 'Meal Photo (Limited Analysis)';
    let ingredients = ['Unknown / Unable to verify from image'];
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let sugar = 0;
    let sodium = 0;
    let isIdentified = false;

    // Recognize standard cues if user provided hint or filename has clear food tag
    if (cue.includes('paneer')) {
      foodName = 'Paneer Dish';
      ingredients = ['Paneer (cottage cheese)', 'Dairy solids', 'Spices'];
      calories = 360; protein = 14; carbs = 16; fat = 24; sodium = 480;
      isIdentified = true;
    } else if (cue.includes('dal')) {
      foodName = 'Lentil Dal';
      ingredients = ['Lentils', 'Water', 'Turmeric', 'Cumin', 'Oil / Ghee'];
      calories = 220; protein = 12; carbs = 32; fat = 6; sodium = 380;
      isIdentified = true;
    } else if (cue.includes('roti') || cue.includes('chapati')) {
      foodName = 'Roti / Chapati';
      ingredients = ['Whole wheat atta', 'Water', 'Salt'];
      calories = 160; protein = 5; carbs = 32; fat = 1; sodium = 80;
      isIdentified = true;
    } else if (cue.includes('biryani')) {
      foodName = 'Biryani';
      ingredients = ['Rice', 'Spices', 'Yogurt / Curd', 'Oil / Ghee'];
      calories = 480; protein = 18; carbs = 60; fat = 16; sodium = 640;
      isIdentified = true;
    } else if (cue.includes('biscuit') || cue.includes('cookie')) {
      foodName = 'Packaged Biscuits';
      ingredients = ['Wheat flour', 'Sugar', 'Vegetable fat', 'Milk solids'];
      calories = 220; protein = 3; carbs = 28; fat = 10; sugar = 14; sodium = 160;
      isIdentified = true;
    }

    const baseFoodData = {
      foodName,
      ingredients,
      nutrition: { calories, protein, carbohydrates: carbs, sugar, fat, sodium },
      uncertainIngredients: isIdentified ? [] : ['Visual verification unavailable']
    };

    const safety = AllergySafetyEngine.evaluatePersonalizedSafety(baseFoodData, userHealthContext);

    // If no clear cue was identifiable, prefer CAUTION over false sense of security
    let riskLevel = safety.riskLevel;
    let riskReasons = [...safety.riskReasons];

    if (!isIdentified) {
      riskLevel = 'CAUTION';
      riskReasons = [
        'AI vision service is temporarily unavailable. We activated our emergency backup safety engine.',
        'Visual ingredients could not be fully verified from the image.'
      ];
    }

    return {
      provider: 'emergency-fallback',
      isFallbackMode: true,
      isLimitedAnalysis: true,
      foodName: isIdentified ? foodName : 'Food Photo (Verification Required)',
      confidence: isIdentified ? 0.70 : 0.40,
      servingSize: 'Estimated standard serving',
      isPackagedProduct: false,
      isUnknownFood: !isIdentified,
      detectedIngredients: ingredients,
      possibleAllergens: safety.matchedUserAllergies.map(m => m.allergen),
      matchedUserAllergies: safety.matchedUserAllergies,
      matchedIntolerances: safety.matchedIntolerances,
      healthConcerns: safety.healthConcerns,
      nutrition: {
        calories,
        protein,
        carbohydrates: carbs,
        sugar,
        fat,
        sodium
      },
      riskLevel,
      riskReasons,
      recommendation: isIdentified
        ? `Backup analysis: ${safety.recommendation}`
        : 'Limited analysis mode: Our AI servers are undergoing maintenance. We are unable to fully verify ingredients right now. Please inspect the printed ingredient and allergen label before consuming.',
      alternativeSuggestion: safety.alternativeSuggestion || 'Verify package ingredients or consult a healthcare professional.',
      uncertainIngredients: isIdentified ? [] : ['Ingredient inspection incomplete'],
      labelVerificationRequired: true,
      profileChecks: [
        ...safety.profileChecks,
        {
          category: 'Safety Mode',
          status: 'caution',
          label: 'Emergency backup active — verify physical package'
        }
      ]
    };
  }

  /**
   * Main Gateway Execution:
   * Primary AI (with retry) -> Secondary AI (Groq/OpenAI) -> Emergency Local Fallback
   */
  static async analyzeFoodImage(fileMeta, userHealthContext = {}, textHint = '', imageBase64 = null) {
    const extracted = this._extractBase64(fileMeta, imageBase64);
    const filename = fileMeta?.originalname || '';

    // ==========================================
    // 1. PRIMARY AI (Google Gemini)
    // ==========================================
    logger.info('[FoodScanner] Primary AI request started (Gemini)');

    let primaryAttempts = 0;
    const maxPrimaryAttempts = 2; // Initial attempt + 1 retry

    while (primaryAttempts < maxPrimaryAttempts) {
      primaryAttempts++;
      try {
        const primaryResult = await GeminiService.analyzeFoodImage(
          fileMeta,
          userHealthContext,
          textHint,
          imageBase64
        );

        if (primaryResult && !primaryResult.isUnknownFood && primaryResult.foodName) {
          logger.info(`[FoodScanner] Primary AI succeeded on attempt ${primaryAttempts}`);
          return {
            ...primaryResult,
            provider: 'primary-ai (gemini)',
            isFallbackMode: false,
            isLimitedAnalysis: false
          };
        }

        // If returned an unidentifiable result without error, allow fallback to see if secondary can identify it
        if (primaryResult && primaryResult.isUnknownFood) {
          logger.warn('[FoodScanner] Primary AI returned low confidence / unidentifiable result. Trying secondary AI.');
          break;
        }
      } catch (primaryErr) {
        logger.warn(`[FoodScanner] Primary AI attempt ${primaryAttempts} failed: ${primaryErr.message}`);
        if (primaryAttempts < maxPrimaryAttempts) {
          // Brief exponential backoff
          await new Promise(res => setTimeout(res, 400 * primaryAttempts));
        }
      }
    }

    // ==========================================
    // 2. SECONDARY AI (Groq / OpenAI Vision)
    // ==========================================
    logger.warn('[FoodScanner] Switching to secondary AI provider (Groq / OpenAI Vision)');

    if (extracted && extracted.base64) {
      try {
        const secondaryResult = await SecondaryAiService.analyzeFoodImage(
          extracted.base64,
          extracted.mimeType,
          userHealthContext,
          textHint
        );

        if (secondaryResult && secondaryResult.foodName) {
          logger.info('[FoodScanner] Secondary AI succeeded');
          return {
            ...secondaryResult,
            isFallbackMode: true,
            isLimitedAnalysis: false
          };
        }
      } catch (secondaryErr) {
        logger.error(`[FoodScanner] Secondary AI failed: ${secondaryErr.message}`);
      }
    } else {
      logger.warn('[FoodScanner] Image base64 data unavailable for secondary AI');
    }

    // ==========================================
    // 3. EMERGENCY LOCAL FALLBACK
    // ==========================================
    logger.warn('[FoodScanner] Both Primary and Secondary AI unavailable. Activating Emergency Local Fallback.');
    return this._runEmergencyLocalFallback(userHealthContext, textHint, filename);
  }
}

module.exports = FoodAnalysisGateway;

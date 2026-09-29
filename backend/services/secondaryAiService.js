/**
 * Secondary Vision AI Service
 * Powered by Groq / OpenAI-compatible Multimodal Vision API
 * Backup provider when primary AI experiences outages, rate limits, or timeouts.
 */

const config = require('../config/env');
const logger = require('../utils/logger');
const AllergySafetyEngine = require('./allergySafetyEngine');

class SecondaryAiService {
  /**
   * Analyze food image with secondary vision model
   */
  static async analyzeFoodImage(base64Data, mimeType = 'image/jpeg', userHealthContext = {}, textHint = '') {
    const apiKey = config.secondaryAi.apiKey;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Secondary AI API key not configured');
    }

    const isGroq = apiKey.startsWith('gsk_') || config.secondaryAi.provider === 'groq';
    const baseUrl = config.secondaryAi.baseUrl || (isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    // Candidate vision models
    const candidateModels = isGroq
      ? [config.secondaryAi.model || 'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview']
      : [config.secondaryAi.model || 'gpt-4o-mini', 'gpt-4o'];

    const userAllergies = Array.isArray(userHealthContext.allergies) ? userHealthContext.allergies : [];
    const medicalConditions = Array.isArray(userHealthContext.medicalConditions) ? userHealthContext.medicalConditions : [];
    const dietType = userHealthContext.dietType || 'balanced';

    const systemPrompt = `You are Cura+ Clinical Food & Allergy Safety AI.
Analyze the uploaded food photo or packaged product label with precision.
USER PROFILE:
- Registered Allergies: ${userAllergies.length > 0 ? userAllergies.join(', ') : 'None registered'}
- Food Intolerances: ${(userHealthContext.foodIntolerances || []).join(', ') || 'None registered'}
- Medical Conditions: ${medicalConditions.length > 0 ? medicalConditions.join(', ') : 'None registered'}
- Diet Preference: ${dietType}

TASK:
1. Identify food name (Recognize Indian foods like Paneer Butter Masala, Dal Makhani, Biryani, Dosa, Idli, Sambar, Roti, Samosa, etc., and packaged foods).
2. Detect visible and derived ingredients (e.g. paneer, butter, cream -> milk; groundnut -> peanut; maida -> wheat/gluten).
3. If blurry or unidentifiable, mark as "Unknown / Unable to verify from image" and set isUnknownFood: true.
4. Output STRICTLY valid JSON with no markdown wrapping:
{
  "foodName": "string",
  "confidence": 0.95,
  "servingSize": "string (estimated)",
  "isPackagedProduct": false,
  "isUnknownFood": false,
  "detectedIngredients": ["string"],
  "possibleAllergens": ["string"],
  "matchedUserAllergies": [
    { "allergen": "string", "foundIn": "string", "severity": "HIGH", "warning": "string" }
  ],
  "matchedIntolerances": [],
  "healthConcerns": [
    { "condition": "string", "concern": "string", "advice": "string" }
  ],
  "nutrition": {
    "calories": 400,
    "protein": 14,
    "carbohydrates": 20,
    "sugar": 6,
    "fat": 25,
    "sodium": 550
  },
  "riskLevel": "LOW | CAUTION | HIGH",
  "riskReasons": ["string"],
  "recommendation": "string",
  "alternativeSuggestion": "string",
  "uncertainIngredients": [],
  "labelVerificationRequired": false
}`;

    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

    let lastError = null;

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      try {
        const payload = {
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this food image against user health profile.${textHint ? ` User note: "${textHint}".` : ''}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText.substring(0, 160)}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error('Empty response from secondary vision model');
        }

        const parsed = JSON.parse(rawContent);

        // Run through deterministic clinical safety engine to guarantee no hallucinations bypass safety
        const clinicalSafety = AllergySafetyEngine.evaluatePersonalizedSafety(parsed, userHealthContext);

        return {
          provider: `secondary-ai (${isGroq ? 'groq' : 'openai'}:${model})`,
          isFallbackMode: true,
          foodName: parsed.foodName || 'Analyzed Food Item',
          confidence: Number(parsed.confidence || 0.92),
          servingSize: parsed.servingSize || '1 standard portion (~220g)',
          isPackagedProduct: Boolean(parsed.isPackagedProduct),
          isUnknownFood: Boolean(parsed.isUnknownFood),
          detectedIngredients: Array.isArray(parsed.detectedIngredients) ? parsed.detectedIngredients : [],
          possibleAllergens: Array.isArray(parsed.possibleAllergens) ? parsed.possibleAllergens : [],
          matchedUserAllergies: clinicalSafety.matchedUserAllergies.length > 0 ? clinicalSafety.matchedUserAllergies : (parsed.matchedUserAllergies || []),
          matchedIntolerances: clinicalSafety.matchedIntolerances.length > 0 ? clinicalSafety.matchedIntolerances : (parsed.matchedIntolerances || []),
          healthConcerns: clinicalSafety.healthConcerns.length > 0 ? clinicalSafety.healthConcerns : (parsed.healthConcerns || []),
          nutrition: {
            calories: Number(parsed.nutrition?.calories || 350),
            protein: Number(parsed.nutrition?.protein || 12),
            carbohydrates: Number(parsed.nutrition?.carbohydrates || 40),
            sugar: Number(parsed.nutrition?.sugar || 5),
            fat: Number(parsed.nutrition?.fat || 14),
            sodium: Number(parsed.nutrition?.sodium || 450)
          },
          riskLevel: clinicalSafety.riskLevel === 'HIGH' ? 'HIGH' : (parsed.riskLevel || clinicalSafety.riskLevel),
          riskReasons: clinicalSafety.riskReasons.length > 0 ? clinicalSafety.riskReasons : (parsed.riskReasons || []),
          recommendation: parsed.recommendation || clinicalSafety.recommendation,
          alternativeSuggestion: parsed.alternativeSuggestion || clinicalSafety.alternativeSuggestion,
          uncertainIngredients: Array.isArray(parsed.uncertainIngredients) ? parsed.uncertainIngredients : [],
          labelVerificationRequired: Boolean(parsed.labelVerificationRequired),
          profileChecks: clinicalSafety.profileChecks
        };
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        logger.warn(`Secondary AI model ${model} failed: ${err.message}`);
      }
    }

    throw lastError || new Error('All secondary AI model candidates failed');
  }
}

module.exports = SecondaryAiService;

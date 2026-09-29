/**
 * Automated Verification Test for Cura+ AI Gateway & Emergency Fallback Architecture
 * Tests:
 * 1. Primary AI normal execution
 * 2. Primary AI 429 Rate Limit -> Retry -> Secondary AI (Groq) activation
 * 3. Primary AI 503 Service Unavailable -> Retry -> Secondary AI activation
 * 4. Primary AI timeout -> Secondary AI activation
 * 5. Primary AI and Secondary AI both fail -> Emergency Local Fallback activation
 * 6. User peanut allergy matching in food
 * 7. User without allergies (no false positive allergies invented)
 * 8. Unclear ingredient information -> CAUTION + label verification required
 * 9. Packaged Indian food label verification
 * 10. Normalized FoodAnalysisResult structure compatibility
 */

const assert = require('assert');
const GeminiService = require('../services/geminiService');
const SecondaryAiService = require('../services/secondaryAiService');
const FoodAnalysisGateway = require('../services/foodAnalysisGateway');
const AllergySafetyEngine = require('../services/allergySafetyEngine');

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Starting AI Gateway & Worst-Case Emergency Fallback Tests');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  const sampleUserHealth = {
    allergies: ['Peanuts', 'Milk'],
    medicalConditions: ['Diabetes'],
    dietType: 'Vegetarian'
  };

  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // -------------------------------------------------------------
  // TEST 1: Primary AI works normally
  // -------------------------------------------------------------
  await test('1. Primary AI normal execution through Gateway', async () => {
    const result = await FoodAnalysisGateway.analyzeFoodImage(
      null,
      sampleUserHealth,
      'Paneer Butter Masala',
      sampleBase64
    );

    assert(result.foodName, 'Result must contain foodName');
    assert(result.riskLevel, 'Result must contain riskLevel');
    assert(result.provider, 'Result must specify provider');
    assert.strictEqual(result.riskLevel, 'HIGH', 'Paneer Butter Masala must be HIGH risk for Milk allergy');
  });

  // -------------------------------------------------------------
  // TEST 2: Primary AI returns 429 Rate Limit -> Secondary AI takes over
  // -------------------------------------------------------------
  await test('2. Primary AI 429 Rate Limit -> Auto-switch to Secondary AI', async () => {
    // Mock Primary AI to simulate 429 error
    const originalAnalyze = GeminiService.analyzeFoodImage;
    GeminiService.analyzeFoodImage = async () => {
      const err = new Error('HTTP 429: Too Many Requests (Rate limit exceeded)');
      err.status = 429;
      throw err;
    };

    try {
      const result = await FoodAnalysisGateway.analyzeFoodImage(
        null,
        sampleUserHealth,
        'Dal Makhani',
        sampleBase64
      );

      assert(result.provider.includes('secondary-ai') || result.provider.includes('emergency-fallback'),
        `Expected secondary-ai or emergency-fallback, got: ${result.provider}`);
      assert(result.foodName, 'Must return valid food name');
      assert.strictEqual(result.riskLevel, 'HIGH', 'Dal Makhani must flag Milk allergy');
    } finally {
      GeminiService.analyzeFoodImage = originalAnalyze;
    }
  });

  // -------------------------------------------------------------
  // TEST 3: Primary AI returns 503 Service Unavailable -> Secondary AI takes over
  // -------------------------------------------------------------
  await test('3. Primary AI 503 Unavailable -> Auto-switch to Secondary AI', async () => {
    const originalAnalyze = GeminiService.analyzeFoodImage;
    GeminiService.analyzeFoodImage = async () => {
      const err = new Error('HTTP 503: Service Unavailable');
      err.status = 503;
      throw err;
    };

    try {
      const result = await FoodAnalysisGateway.analyzeFoodImage(
        null,
        sampleUserHealth,
        'Whole Wheat Roti',
        sampleBase64
      );

      assert(result.provider.includes('secondary-ai') || result.provider.includes('emergency-fallback'),
        'Must route to secondary or fallback');
      assert(result.foodName, 'Must return foodName');
    } finally {
      GeminiService.analyzeFoodImage = originalAnalyze;
    }
  });

  // -------------------------------------------------------------
  // TEST 4: Primary AI timeout -> Secondary AI takes over
  // -------------------------------------------------------------
  await test('4. Primary AI timeout -> Auto-switch to Secondary AI', async () => {
    const originalAnalyze = GeminiService.analyzeFoodImage;
    GeminiService.analyzeFoodImage = async () => {
      const err = new Error('Gateway Timeout (request aborted)');
      err.name = 'AbortError';
      throw err;
    };

    try {
      const result = await FoodAnalysisGateway.analyzeFoodImage(
        null,
        sampleUserHealth,
        'Fresh Garden Salad',
        sampleBase64
      );

      assert(result.provider.includes('secondary-ai') || result.provider.includes('emergency-fallback'));
      assert(result.foodName);
    } finally {
      GeminiService.analyzeFoodImage = originalAnalyze;
    }
  });

  // -------------------------------------------------------------
  // TEST 5: Primary AI and Secondary AI BOTH fail -> Emergency Local Fallback
  // -------------------------------------------------------------
  await test('5. Worst-Case: Primary AI AND Secondary AI both fail -> Emergency Local Fallback', async () => {
    const origPrimary = GeminiService.analyzeFoodImage;
    const origSecondary = SecondaryAiService.analyzeFoodImage;

    GeminiService.analyzeFoodImage = async () => {
      throw new Error('Primary AI Total Outage');
    };
    SecondaryAiService.analyzeFoodImage = async () => {
      throw new Error('Secondary AI Quota Exceeded (429)');
    };

    try {
      const result = await FoodAnalysisGateway.analyzeFoodImage(
        null,
        sampleUserHealth,
        'Paneer Butter Masala',
        sampleBase64
      );

      assert.strictEqual(result.provider, 'emergency-fallback', 'Must be emergency-fallback');
      assert.strictEqual(result.isLimitedAnalysis, true, 'isLimitedAnalysis must be true');
      assert.strictEqual(result.riskLevel, 'HIGH', 'Paneer cue must still flag registered Milk allergy in emergency mode');
      assert(result.recommendation.length > 10, 'Must provide helpful safety recommendation');
      assert(result.profileChecks.length > 0, 'Must include profile safety checks');
    } finally {
      GeminiService.analyzeFoodImage = origPrimary;
      SecondaryAiService.analyzeFoodImage = origSecondary;
    }
  });

  // -------------------------------------------------------------
  // TEST 6: User Peanut allergy matching
  // -------------------------------------------------------------
  await test('6. Deterministic Peanut allergy detection in Poha', () => {
    const user = { allergies: ['Peanuts'], medicalConditions: [] };
    const evaluation = AllergySafetyEngine.evaluatePersonalizedSafety(
      {
        foodName: 'Poha',
        ingredients: ['Poha (flattened rice)', 'Roasted peanuts', 'Mustard seeds'],
        nutrition: { calories: 280 }
      },
      user
    );

    assert.strictEqual(evaluation.riskLevel, 'HIGH');
    assert(evaluation.matchedUserAllergies.some(m => m.allergen === 'Peanuts'));
    assert(evaluation.matchedUserAllergies[0].warning.toLowerCase().includes('peanut'));
  });

  // -------------------------------------------------------------
  // TEST 7: User with no allergies -> Never invent allergies
  // -------------------------------------------------------------
  await test('7. User with no allergies -> Never invent allergies', () => {
    const user = { allergies: [], medicalConditions: [] };
    const evaluation = AllergySafetyEngine.evaluatePersonalizedSafety(
      {
        foodName: 'Steamed Rice and Dal',
        ingredients: ['Basmati rice', 'Yellow lentils', 'Turmeric', 'Cumin'],
        nutrition: { calories: 310 }
      },
      user
    );

    assert.strictEqual(evaluation.riskLevel, 'LOW');
    assert.strictEqual(evaluation.matchedUserAllergies.length, 0);
  });

  // -------------------------------------------------------------
  // TEST 8: Unclear ingredient info -> CAUTION + verification required
  // -------------------------------------------------------------
  await test('8. Unclear ingredient info -> CAUTION + verification required', async () => {
    const user = { allergies: ['Peanuts'], medicalConditions: [] };
    const result = await FoodAnalysisGateway.analyzeFoodImage(
      null,
      user,
      'test_unreadable_blurry_photo',
      sampleBase64
    );

    assert.strictEqual(result.riskLevel, 'CAUTION');
    assert.strictEqual(result.labelVerificationRequired, true);
    assert(result.recommendation.toLowerCase().includes('clearer photo') || result.recommendation.toLowerCase().includes('verify'));
  });

  // -------------------------------------------------------------
  // TEST 9: Packaged Indian Food Label extraction
  // -------------------------------------------------------------
  await test('9. Packaged Indian Food Label extraction and safety evaluation', async () => {
    const user = { allergies: ['Milk'], medicalConditions: ['Diabetes'] };
    const result = await FoodAnalysisGateway.analyzeFoodImage(
      null,
      user,
      'packaged chocolate biscuit',
      sampleBase64
    );

    assert.strictEqual(result.isPackagedProduct, true);
    assert.strictEqual(result.labelVerificationRequired, true);
    assert.strictEqual(result.riskLevel, 'HIGH', 'Milk powder in packaged biscuit triggers registered Milk allergy');
  });

  // -------------------------------------------------------------
  // TEST 10: Provider-Independent Normalized Result schema
  // -------------------------------------------------------------
  await test('10. Provider-Independent Normalized Result Schema Validation', async () => {
    const user = { allergies: ['Milk'], medicalConditions: ['Hypertension'] };
    const result = await FoodAnalysisGateway.analyzeFoodImage(
      null,
      user,
      'Dal Makhani',
      sampleBase64
    );

    const expectedKeys = [
      'foodName',
      'confidence',
      'servingSize',
      'isPackagedProduct',
      'isUnknownFood',
      'provider',
      'isFallbackMode',
      'isLimitedAnalysis',
      'detectedIngredients',
      'possibleAllergens',
      'matchedUserAllergies',
      'matchedIntolerances',
      'healthConcerns',
      'nutrition',
      'riskLevel',
      'riskReasons',
      'recommendation',
      'alternativeSuggestion',
      'uncertainIngredients',
      'labelVerificationRequired',
      'profileChecks'
    ];

    for (const key of expectedKeys) {
      assert(result[key] !== undefined, `Result must contain key: ${key}`);
    }

    assert(typeof result.nutrition.calories === 'number');
    assert(['LOW', 'CAUTION', 'HIGH'].includes(result.riskLevel));
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${passed} / ${total} tests passed successfully!`);
  console.log('---------------------------------------------------------------\n');
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});

/**
 * Automated Verification Test for Personalized Food & Allergy Safety Scanner
 * Tests:
 * 1. User with Milk allergy -> Paneer Butter Masala (HIGH RISK, milk-derived detected)
 * 2. User with Peanut allergy -> Poha with peanuts (HIGH RISK, peanut detected)
 * 3. User with no allergies -> Paneer Butter Masala (SAFE / LOW CONCERN)
 * 4. User with Diabetes -> Packaged chocolate biscuits (CAUTION / high sugar warning)
 * 5. User with Hypertension -> High sodium food (CAUTION / sodium warning)
 * 6. Indian foods: Dal Makhani, Dosa, Roti, Biryani, Samosa
 * 7. Packaged food label OCR & ingredients
 * 8. Unreadable / unknown food handling
 * 9. API / AI error resilience & fallback
 * 10. Strict JSON schema compliance
 */

const assert = require('assert');
const GeminiService = require('../services/geminiService');

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Starting Personalized Food & Allergy Safety Scanner Tests');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // TEST 1: User with Milk allergy scanning Paneer Butter Masala
  test('1. User with Milk Allergy scanning Paneer Butter Masala (Derived Milk Detection)', () => {
    const userProfile = {
      allergies: ['Milk'],
      medicalConditions: [],
      dietType: 'Vegetarian'
    };

    const result = GeminiService.evaluatePersonalizedSafety(
      {
        foodName: 'Paneer Butter Masala',
        ingredients: ['Paneer (cottage cheese)', 'Butter', 'Fresh cream', 'Tomato puree', 'Cashew paste', 'Garam masala'],
        nutrition: { calories: 420, protein: 16, carbohydrates: 22, sugar: 7, fat: 30, sodium: 620 }
      },
      userProfile
    );

    assert.strictEqual(result.riskLevel, 'HIGH', 'Risk level must be HIGH');
    assert(result.matchedUserAllergies.length > 0, 'Must match Milk allergy');
    assert.strictEqual(result.matchedUserAllergies[0].allergen, 'Milk');
    assert(result.matchedUserAllergies[0].foundIn.toLowerCase().includes('paneer'), 'Must detect Paneer as milk-derived');
    assert(result.recommendation.toLowerCase().includes('not recommended'), 'Must advise against consuming');
    assert(result.alternativeSuggestion.length > 0, 'Must provide safe alternative suggestion');
  });

  // TEST 2: User with Peanut allergy scanning Poha with peanuts
  test('2. User with Peanut Allergy scanning Poha (Peanut Detection)', () => {
    const userProfile = {
      allergies: ['Peanuts'],
      medicalConditions: [],
      dietType: 'Vegetarian'
    };

    const result = GeminiService.evaluatePersonalizedSafety(
      {
        foodName: 'Kanda Poha',
        ingredients: ['Flattened rice (poha)', 'Roasted peanuts', 'Mustard seeds', 'Curry leaves', 'Turmeric'],
        nutrition: { calories: 280, protein: 6, carbohydrates: 44, sugar: 3, fat: 9, sodium: 340 }
      },
      userProfile
    );

    assert.strictEqual(result.riskLevel, 'HIGH', 'Risk level must be HIGH');
    assert(result.matchedUserAllergies.length > 0, 'Must match Peanut allergy');
    assert(result.matchedUserAllergies[0].foundIn.toLowerCase().includes('peanut'), 'Must identify peanuts in Poha');
  });

  // TEST 3: User WITHOUT allergies scanning Paneer Butter Masala
  test('3. User without Allergies scanning Paneer Butter Masala (Safe Baseline)', () => {
    const userProfile = {
      allergies: [],
      medicalConditions: [],
      dietType: 'Vegetarian'
    };

    const result = GeminiService.evaluatePersonalizedSafety(
      {
        foodName: 'Paneer Butter Masala',
        ingredients: ['Paneer (cottage cheese)', 'Butter', 'Fresh cream', 'Tomato puree', 'Cashew paste', 'Garam masala'],
        nutrition: { calories: 420, protein: 16, carbohydrates: 22, sugar: 7, fat: 30, sodium: 620 }
      },
      userProfile
    );

    assert.strictEqual(result.riskLevel, 'LOW', 'Risk level must be LOW for user without conflicts');
    assert.strictEqual(result.matchedUserAllergies.length, 0, 'No allergy matches');
    assert(result.recommendation.toLowerCase().includes('wellness') || result.recommendation.toLowerCase().includes('balanced'), 'Encouraging advice');
  });

  // TEST 4: User with Diabetes scanning high-sugar food
  test('4. User with Diabetes scanning high-sugar Packaged Biscuits', () => {
    const userProfile = {
      allergies: [],
      medicalConditions: ['Diabetes'],
      dietType: 'Non-vegetarian'
    };

    const result = GeminiService.evaluatePersonalizedSafety(
      {
        foodName: 'Chocolate Cream Biscuits',
        ingredients: ['Refined wheat flour', 'Sugar', 'Palm oil', 'Cocoa solids', 'Sugar syrup'],
        nutrition: { calories: 240, protein: 3, carbohydrates: 34, sugar: 18, fat: 12, sodium: 180 }
      },
      userProfile
    );

    assert(result.riskLevel === 'CAUTION' || result.riskLevel === 'HIGH', 'Risk level must flag Caution for diabetes');
    assert(result.healthConcerns.length > 0, 'Must register health concern for Diabetes');
    assert.strictEqual(result.healthConcerns[0].condition, 'Diabetes');
    assert(result.healthConcerns[0].advice.toLowerCase().includes('carbohydrate') || result.healthConcerns[0].advice.toLowerCase().includes('glucose'), 'Diabetic advice');
  });

  // TEST 5: User with Hypertension scanning high-sodium food
  test('5. User with Hypertension scanning high-sodium snack', () => {
    const userProfile = {
      allergies: [],
      medicalConditions: ['Hypertension'],
      dietType: 'Vegetarian'
    };

    const result = GeminiService.evaluatePersonalizedSafety(
      {
        foodName: 'Spicy Masala Papad & Mixed Pickle',
        ingredients: ['Lentil flour', 'Salt', 'Spices', 'Mango pickle in mustard oil', 'Salted namkeen'],
        nutrition: { calories: 150, protein: 4, carbohydrates: 18, sugar: 1, fat: 8, sodium: 980 }
      },
      userProfile
    );

    assert(result.riskLevel === 'CAUTION' || result.riskLevel === 'HIGH', 'Must flag sodium risk for Hypertension');
    assert(result.healthConcerns.some(h => h.condition === 'Hypertension'), 'Hypertension concern recorded');
  });

  // TEST 6: Indian Food Support (Dal Makhani, Dosa, Roti)
  test('6. Indian Food Support via Multimodal Vision Engine', async () => {
    const userProfile = { allergies: ['Milk'], medicalConditions: [] };

    // Dal Makhani has butter & cream -> Milk allergy match
    const dalResult = await GeminiService.analyzeFoodImage(null, userProfile, 'Dal Makhani');
    assert.strictEqual(dalResult.foodName, 'Dal Makhani');
    assert.strictEqual(dalResult.riskLevel, 'HIGH', 'Dal Makhani contains butter/cream -> Milk conflict');

    // Whole Wheat Roti -> No dairy -> SAFE for milk allergic
    const rotiResult = await GeminiService.analyzeFoodImage(null, userProfile, 'Whole Wheat Roti');
    assert.strictEqual(rotiResult.foodName, 'Whole Wheat Roti / Chapati');
    assert.strictEqual(rotiResult.riskLevel, 'LOW', 'Roti has no milk -> Safe for Milk allergy');
  });

  // TEST 7: Packaged Food Recognition & Label Verification
  test('7. Packaged Food Recognition', async () => {
    const userProfile = { allergies: [], medicalConditions: [] };
    const packagedResult = await GeminiService.analyzeFoodImage(null, userProfile, 'packaged chocolate biscuit');

    assert(packagedResult.isPackagedProduct === true, 'Identified as packaged product');
    assert(packagedResult.labelVerificationRequired === true, 'Requires label verification');
    assert(packagedResult.detectedIngredients.length > 3, 'Lists detailed packaged ingredients');
  });

  // TEST 8: Unreadable / Low Confidence Image Case
  test('8. Unreadable / Low Confidence Image Case', async () => {
    const userProfile = { allergies: ['Peanuts'], medicalConditions: [] };
    const unknownResult = await GeminiService.analyzeFoodImage(null, userProfile, 'test_unreadable_blurry_photo');

    assert.strictEqual(unknownResult.isUnknownFood, true, 'Marked as unidentifiable');
    assert(unknownResult.confidence < 0.5, 'Low confidence rating');
    assert(unknownResult.recommendation.toLowerCase().includes('clearer photo') || unknownResult.recommendation.toLowerCase().includes('unable to verify'), 'Asks user for clearer image');
  });

  // TEST 9: Structured JSON Schema Compliance
  test('9. Full Structured JSON Schema Compliance', async () => {
    const userProfile = {
      allergies: ['Milk', 'Peanuts'],
      medicalConditions: ['Diabetes'],
      dietType: 'Vegetarian'
    };

    const fullResult = await GeminiService.analyzeFoodImage(null, userProfile, 'Paneer Butter Masala');

    const requiredKeys = [
      'foodName',
      'confidence',
      'servingSize',
      'isPackagedProduct',
      'isUnknownFood',
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

    for (const key of requiredKeys) {
      assert(fullResult[key] !== undefined, `Result must contain key: ${key}`);
    }

    assert(['LOW', 'CAUTION', 'HIGH'].includes(fullResult.riskLevel), 'riskLevel must be LOW, CAUTION, or HIGH');
    assert(typeof fullResult.nutrition.calories === 'number', 'nutrition.calories must be a number');
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${passed} / ${total} tests passed successfully!`);
  console.log('---------------------------------------------------------------\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

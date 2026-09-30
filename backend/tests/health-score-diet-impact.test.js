/**
 * Tests for Dynamic Dashboard Health Score Impact from Food Scanner & Logged Meals
 */

const assert = require('assert');
const HealthScoreService = require('../services/healthScoreService');

async function runHealthScoreDietImpactTests() {
  console.log('🧪 Starting Dashboard Health Score & Food Scanner Impact Tests...\n');

  const profile = {
    allergies: ['Peanuts'],
    medicalConditions: ['Diabetes'],
    targets: {
      dailyCalories: 2000,
      macros: { protein: { grams: 100 } },
      steps: 8000,
      waterMl: 2500,
      sleepHours: 8
    }
  };

  const baselineMetrics = {
    steps: 7400,
    targetSteps: 8000,
    waterMl: 2500,
    targetWaterMl: 2500,
    sleepHours: 8,
    targetSleepHours: 8,
    activeCaloriesBurnt: 350
  };

  const emptyNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  // 1. Baseline Score (no meals logged yet)
  const baselineResult = HealthScoreService.calculateDailyScore(profile, emptyNutrition, baselineMetrics, []);
  console.log(`Baseline Dashboard Score (No meals): ${baselineResult.overallScore} (${baselineResult.status})`);
  assert.ok(baselineResult.overallScore >= 70, 'Baseline score should be solid based on good sleep and hydration');

  // 2. Low Rating Meal (White Bread - high glycemic 55/100)
  const lowRatingBread = {
    name: 'White Bread',
    calories: 140,
    protein: 4,
    carbs: 28,
    fat: 1.5,
    ingredients: ['Refined wheat flour', 'Sugar', 'Yeast', 'Salt']
  };

  const breadNutrition = { calories: 140, protein: 4, carbs: 28, fat: 1.5, fiber: 1 };
  const breadResult = HealthScoreService.calculateDailyScore(profile, breadNutrition, baselineMetrics, [lowRatingBread]);
  console.log(`Score after Low Rating Bread: ${breadResult.overallScore} (${breadResult.status})`);
  assert.ok(
    breadResult.overallScore < baselineResult.overallScore,
    `Low-rating food must decrease dashboard health score: ${breadResult.overallScore} should be < ${baselineResult.overallScore}`
  );
  console.log('✅ [PASS] 1. Low rating food decreases Dashboard Health Score');

  // 3. Allergen Conflict Meal (Poha with Peanuts for Peanut allergy user)
  const allergenPeanutMeal = {
    name: 'Poha with Roasted Peanuts',
    calories: 320,
    protein: 9,
    carbs: 48,
    fat: 11,
    ingredients: ['Flattened rice', 'Roasted Peanuts', 'Mustard seeds', 'Curry leaves']
  };

  const peanutNutrition = { calories: 320, protein: 9, carbs: 48, fat: 11, fiber: 2 };
  const allergenResult = HealthScoreService.calculateDailyScore(profile, peanutNutrition, baselineMetrics, [allergenPeanutMeal]);
  console.log(`Score after Allergen Conflict Meal: ${allergenResult.overallScore} (${allergenResult.status})`);
  assert.ok(
    allergenResult.overallScore < breadResult.overallScore,
    `Allergen conflict must cause heavy score drop: ${allergenResult.overallScore} should be < ${breadResult.overallScore}`
  );
  assert.strictEqual(allergenResult.dietImpact.allergenConflictCount, 1, 'Should record 1 allergen conflict');
  console.log('✅ [PASS] 2. Allergen conflict causes significant penalty and decreases score');

  // 4. Highly Suitable, Nutrient-Dense Meal (Quinoa Chicken Veggie Bowl 94/100)
  const healthyBowl = {
    name: 'Quinoa Bowl with Grilled Chicken & Spinach',
    calories: 460,
    protein: 38,
    carbs: 42,
    fat: 10,
    ingredients: ['Quinoa', 'Grilled chicken breast', 'Spinach', 'Cucumber', 'Olive oil', 'Lemon juice']
  };

  const healthyNutrition = { calories: 460, protein: 38, carbs: 42, fat: 10, fiber: 6 };
  const healthyResult = HealthScoreService.calculateDailyScore(profile, healthyNutrition, baselineMetrics, [healthyBowl]);
  console.log(`Score after Healthy Suitable Meal: ${healthyResult.overallScore} (${healthyResult.status})`);
  assert.ok(
    healthyResult.overallScore > baselineResult.overallScore,
    `Healthy suitable food must increase dashboard health score: ${healthyResult.overallScore} should be > ${baselineResult.overallScore}`
  );
  assert.ok(
    healthyResult.overallScore > breadResult.overallScore,
    `Healthy food must score higher than low-rating bread: ${healthyResult.overallScore} should be > ${breadResult.overallScore}`
  );
  console.log('✅ [PASS] 3. Suitable and healthy food increases Dashboard Health Score');

  // 5. Verify Diet Impact metadata & transparency
  assert.ok(healthyResult.dietImpact.avgFoodHealthScore >= 80, 'Avg food score should reflect high rating');
  assert.ok(healthyResult.insights.includes('boosted') || healthyResult.insights.includes('Excellent'), 'Insight highlights healthy choices');
  console.log('✅ [PASS] 4. Diet impact metadata and clinical insights verified');

  console.log('\n🎉 All Health Score & Food Scanner Impact Tests Passed Successfully!');
}

runHealthScoreDietImpactTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

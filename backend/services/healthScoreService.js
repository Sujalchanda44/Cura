/**
 * Health Score Calculation Engine
 * Produces an overall 0-100 score composed of 4 key health pillars:
 * 1. Nutrition & Food Quality (Quantitative goals + Qualitative Food Health Ratings & Clinical Safety)
 * 2. Physical Activity & Calorie Burn
 * 3. Sleep & Rest Recovery
 * 4. Hydration & Fluid Balance
 */

const AllergySafetyEngine = require('./allergySafetyEngine');
const logger = require('../utils/logger');

class HealthScoreService {
  /**
   * Calculate Health Score for a single day
   * @param {Object} healthProfile - Authenticated user's health profile (allergies, medical conditions, goals)
   * @param {Object} nutritionTotals - Aggregated daily macronutrients (calories, protein, carbs, fat, fiber)
   * @param {Object} dailyMetrics - Daily metrics (steps, waterMl, sleepHours, activeCaloriesBurnt)
   * @param {Array} recentMeals - List of meals logged by the user today
   */
  static calculateDailyScore(healthProfile, nutritionTotals, dailyMetrics, recentMeals = []) {
    const targets = healthProfile?.targets || {
      dailyCalories: 2000,
      macros: { protein: { grams: 120 } },
      steps: 8000,
      waterMl: 2500,
      sleepHours: 8
    };

    // -------------------------------------------------------------
    // 1. Food Scanner & Nutrition Evaluation (Allergy & Condition Safety)
    // -------------------------------------------------------------
    const mealEvaluations = [];
    let avgFoodHealthScore = 75; // baseline neutral if no meals logged yet
    let totalFoodScoreSum = 0;
    let allergenConflictCount = 0;
    let conditionConflictCount = 0;
    let harmfulMealCount = 0;
    let cautionMealCount = 0;
    let excellentMealCount = 0;

    if (Array.isArray(recentMeals) && recentMeals.length > 0) {
      for (const meal of recentMeals) {
        try {
          const safetyEval = AllergySafetyEngine.evaluatePersonalizedSafety(
            {
              foodName: meal.name,
              ingredients: meal.ingredients || [],
              nutrition: {
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbohydrates: meal.carbs || 0,
                fat: meal.fat || 0
              }
            },
            healthProfile || {}
          );

          const scoreData = AllergySafetyEngine.computeFoodHealthScore(
            {
              foodName: meal.name,
              ingredients: meal.ingredients || [],
              nutrition: {
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbohydrates: meal.carbs || 0,
                fat: meal.fat || 0
              }
            },
            safetyEval,
            healthProfile || {}
          );

          const foodScore = Number(scoreData.healthScore) || 70;
          totalFoodScoreSum += foodScore;

          if (scoreData.allergyConflict || safetyEval.riskLevel === 'HIGH') {
            allergenConflictCount++;
          }
          if (safetyEval.healthConcerns && safetyEval.healthConcerns.length > 0) {
            conditionConflictCount++;
          }
          if (foodScore < 40) harmfulMealCount++;
          else if (foodScore < 70) cautionMealCount++;
          else if (foodScore >= 85) excellentMealCount++;

          mealEvaluations.push({
            name: meal.name,
            score: foodScore,
            status: scoreData.status,
            allergyConflict: scoreData.allergyConflict,
            mainConcern: scoreData.mainConcern
          });
        } catch (err) {
          logger.warn('Failed to evaluate meal score for health score engine:', err.message);
        }
      }

      if (mealEvaluations.length > 0) {
        avgFoodHealthScore = Math.round(totalFoodScoreSum / mealEvaluations.length);
      }
    }

    // -------------------------------------------------------------
    // PILLAR 1: NUTRITION SCORE (35 points max)
    // -------------------------------------------------------------
    // A. Quantity Adherence (15 pts max)
    let quantityScore = 0;
    const targetCals = targets.dailyCalories || 2000;
    const actualCals = nutritionTotals?.calories || 0;

    if (actualCals > 0) {
      const calRatio = actualCals / targetCals;
      if (calRatio >= 0.85 && calRatio <= 1.15) {
        quantityScore += 9;
      } else if (calRatio >= 0.7 && calRatio <= 1.3) {
        quantityScore += 6;
      } else {
        quantityScore += 3;
      }

      const targetProtein = targets.macros?.protein?.grams || 100;
      const actualProtein = nutritionTotals?.protein || 0;
      const proteinRatio = Math.min(1.0, actualProtein / targetProtein);
      quantityScore += Math.round(proteinRatio * 6);
    } else {
      quantityScore = 8; // neutral if pending food log
    }

    // B. Quality & Food Rating Component (20 pts max)
    // Dynamically scales with average food health rating:
    // avgFoodScore 95 (Superfood) -> 19 pts
    // avgFoodScore 80 (Good)      -> 16 pts
    // avgFoodScore 55 (Caution)   -> 11 pts
    // avgFoodScore 25 (Harmful)   -> 5 pts
    let qualityScore = 0;
    if (mealEvaluations.length > 0) {
      qualityScore = Math.max(2, Math.min(20, Math.round((avgFoodHealthScore / 100) * 20)));
    } else {
      qualityScore = 12; // baseline neutral
    }

    let nutritionScore = quantityScore + qualityScore;

    // C. Clinical Penalties & Clean Eating Bonuses
    let dietPenalty = 0;
    let dietBonus = 0;

    // Severe deduction for allergen conflicts (anaphylaxis / active health threat)
    if (allergenConflictCount > 0) {
      dietPenalty += 18 * allergenConflictCount;
      nutritionScore = Math.max(0, nutritionScore - 15);
    }

    // Moderate deduction for chronic condition conflicts (e.g. diabetes sugar spike)
    if (conditionConflictCount > 0 && allergenConflictCount === 0) {
      dietPenalty += 6 * conditionConflictCount;
    }

    // Deduction for harmful / low-rated meals
    if (harmfulMealCount > 0 && allergenConflictCount === 0) {
      dietPenalty += 8 * harmfulMealCount;
    } else if (cautionMealCount > 0 && avgFoodHealthScore < 65) {
      dietPenalty += 4 * cautionMealCount;
    }

    // Clean eating bonus if all meals are high-quality, allergen-safe & disease-compatible
    if (
      mealEvaluations.length > 0 &&
      allergenConflictCount === 0 &&
      conditionConflictCount === 0 &&
      harmfulMealCount === 0 &&
      cautionMealCount === 0 &&
      avgFoodHealthScore >= 75
    ) {
      dietBonus += Math.min(8, 3 + (excellentMealCount * 2));
    }

    // -------------------------------------------------------------
    // PILLAR 2: PHYSICAL ACTIVITY (25 points max)
    // -------------------------------------------------------------
    let activityScore = 0;
    const targetSteps = dailyMetrics?.targetSteps || targets.steps || 8000;
    const actualSteps = dailyMetrics?.steps || 0;
    const stepRatio = Math.min(1.2, actualSteps / targetSteps);
    activityScore += Math.min(17, Math.round(stepRatio * 17));

    const activeCals = dailyMetrics?.activeCaloriesBurnt || 0;
    if (activeCals >= 400) activityScore += 8;
    else if (activeCals >= 200) activityScore += 5;
    else activityScore += 2;

    // -------------------------------------------------------------
    // PILLAR 3: SLEEP RECOVERY (20 points max)
    // -------------------------------------------------------------
    let sleepScore = 0;
    const sleepHours = dailyMetrics?.sleepHours || 0;
    if (sleepHours >= 7 && sleepHours <= 9) {
      sleepScore = 20;
    } else if ((sleepHours >= 6 && sleepHours < 7) || (sleepHours > 9 && sleepHours <= 10)) {
      sleepScore = 14;
    } else if (sleepHours > 0) {
      sleepScore = 8;
    } else {
      sleepScore = 12; // neutral
    }

    // -------------------------------------------------------------
    // PILLAR 4: HYDRATION BALANCE (20 points max)
    // -------------------------------------------------------------
    let hydrationScore = 0;
    const targetWater = dailyMetrics?.targetWaterMl || targets.waterMl || 2500;
    const actualWater = dailyMetrics?.waterMl || 0;
    const waterRatio = Math.min(1.0, actualWater / targetWater);
    hydrationScore = Math.round(waterRatio * 20);

    // -------------------------------------------------------------
    // TOTAL OVERALL HEALTH SCORE (0 - 100)
    // -------------------------------------------------------------
    let totalScore = nutritionScore + activityScore + sleepScore + hydrationScore - dietPenalty + dietBonus;
    totalScore = Math.min(100, Math.max(5, Math.round(totalScore)));

    let grade = 'A';
    let status = 'Excellent';
    if (totalScore < 60) {
      grade = 'D';
      status = 'Needs Attention';
    } else if (totalScore < 75) {
      grade = 'C';
      status = 'Fair';
    } else if (totalScore < 90) {
      grade = 'B';
      status = 'Good';
    }

    // Dynamic Clinical Insight
    let insights = '';
    if (allergenConflictCount > 0) {
      insights = '⚠️ Allergen conflict detected in logged meals. Health score heavily reduced for clinical safety monitoring.';
    } else if (harmfulMealCount > 0 || avgFoodHealthScore < 50) {
      insights = 'Your health score dipped due to low-rated food logged today. Switch to wholesome, low-glycemic foods to recover.';
    } else if (cautionMealCount > 0 && avgFoodHealthScore < 65) {
      insights = 'Logged meal has a lower food rating (e.g. high glycemic index or sodium). Balance with fiber greens to raise your score.';
    } else if (dietBonus > 0 || avgFoodHealthScore >= 80) {
      insights = '🌟 Excellent food choices! Eating allergy-safe, nutrient-rich meals boosted your Health Score today.';
    } else if (totalScore >= 80) {
      insights = 'Outstanding balance across nutrition, hydration, and activity!';
    } else {
      insights = 'Focus on increasing water intake and choosing high-rated foods to elevate your score.';
    }

    return {
      overallScore: totalScore,
      grade,
      status,
      breakdown: {
        nutrition: {
          score: Math.min(35, Math.max(0, nutritionScore - dietPenalty + dietBonus)),
          max: 35,
          percentage: Math.round((Math.max(0, nutritionScore - dietPenalty + dietBonus) / 35) * 100)
        },
        activity: { score: activityScore, max: 25, percentage: Math.round((activityScore / 25) * 100) },
        sleep: { score: sleepScore, max: 20, percentage: Math.round((sleepScore / 20) * 100) },
        hydration: { score: hydrationScore, max: 20, percentage: Math.round((hydrationScore / 20) * 100) }
      },
      dietImpact: {
        mealsEvaluated: mealEvaluations.length,
        avgFoodHealthScore,
        allergenConflictCount,
        conditionConflictCount,
        harmfulMealCount,
        cautionMealCount,
        excellentMealCount,
        penalty: dietPenalty,
        bonus: dietBonus,
        evaluations: mealEvaluations
      },
      insights
    };
  }
}

module.exports = HealthScoreService;

/**
 * Health Score Calculation Engine
 * Produces an overall 0-100 score composed of 4 key health pillars
 */

class HealthScoreService {
  /**
   * Calculate Health Score for a single day
   */
  static calculateDailyScore(healthProfile, nutritionTotals, dailyMetrics) {
    const targets = healthProfile?.targets || {
      dailyCalories: 2000,
      macros: { protein: { grams: 120 } },
      steps: 8000,
      waterMl: 2500,
      sleepHours: 8
    };

    // 1. Nutrition Score (30 points max)
    let nutritionScore = 0;
    const targetCals = targets.dailyCalories || 2000;
    const actualCals = nutritionTotals?.calories || 0;

    if (actualCals > 0) {
      const calRatio = actualCals / targetCals;
      // Ideal is between 0.85 and 1.15 of target
      if (calRatio >= 0.85 && calRatio <= 1.15) {
        nutritionScore += 18;
      } else if (calRatio >= 0.7 && calRatio <= 1.3) {
        nutritionScore += 12;
      } else {
        nutritionScore += 6;
      }

      // Protein target check (12 points max)
      const targetProtein = targets.macros?.protein?.grams || 100;
      const actualProtein = nutritionTotals?.protein || 0;
      const proteinRatio = Math.min(1.0, actualProtein / targetProtein);
      nutritionScore += Math.round(proteinRatio * 12);
    } else {
      nutritionScore = 15; // default neutral if not fully logged yet
    }

    // 2. Activity Score (30 points max)
    let activityScore = 0;
    const targetSteps = dailyMetrics?.targetSteps || targets.steps || 8000;
    const actualSteps = dailyMetrics?.steps || 0;
    const stepRatio = Math.min(1.2, actualSteps / targetSteps);
    activityScore += Math.min(20, Math.round(stepRatio * 20));

    const activeCals = dailyMetrics?.activeCaloriesBurnt || 0;
    if (activeCals >= 400) activityScore += 10;
    else if (activeCals >= 200) activityScore += 6;
    else activityScore += 3;

    // 3. Sleep Score (20 points max)
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

    // 4. Hydration & Consistency Score (20 points max)
    let hydrationScore = 0;
    const targetWater = dailyMetrics?.targetWaterMl || targets.waterMl || 2500;
    const actualWater = dailyMetrics?.waterMl || 0;
    const waterRatio = Math.min(1.0, actualWater / targetWater);
    hydrationScore = Math.round(waterRatio * 20);

    // Sum total
    const totalScore = Math.min(100, Math.max(0, nutritionScore + activityScore + sleepScore + hydrationScore));

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

    return {
      overallScore: totalScore,
      grade,
      status,
      breakdown: {
        nutrition: { score: nutritionScore, max: 30, percentage: Math.round((nutritionScore / 30) * 100) },
        activity: { score: activityScore, max: 30, percentage: Math.round((activityScore / 30) * 100) },
        sleep: { score: sleepScore, max: 20, percentage: Math.round((sleepScore / 20) * 100) },
        hydration: { score: hydrationScore, max: 20, percentage: Math.round((hydrationScore / 20) * 100) }
      },
      insights: totalScore >= 80
        ? 'Outstanding balance across nutrition, hydration, and activity!'
        : 'Focus on increasing water intake and hitting your daily step target to elevate your score.'
    };
  }
}

module.exports = HealthScoreService;

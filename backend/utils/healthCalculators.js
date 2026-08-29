/**
 * Health & Nutritional Mathematics Calculators
 * Formulas based on Mifflin-St Jeor and WHO guidelines
 */

const { ACTIVITY_MULTIPLIERS, HEALTH_GOALS } = require('../config/constants');

class HealthCalculators {
  /**
   * Calculate Body Mass Index (BMI)
   * BMI = weight (kg) / (height (m) ^ 2)
   */
  static calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return parseFloat(bmi.toFixed(1));
  }

  /**
   * Determine BMI Category
   */
  static getBMICategory(bmi) {
    if (!bmi) return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25.0) return 'Normal weight';
    if (bmi < 30.0) return 'Overweight';
    if (bmi < 35.0) return 'Obesity Class I';
    if (bmi < 40.0) return 'Obesity Class II';
    return 'Obesity Class III (Severe)';
  }

  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
   * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
   */
  static calculateBMR(weightKg, heightCm, age, gender = 'male') {
    if (!weightKg || !heightCm || !age) return null;
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    const bmr = gender.toLowerCase() === 'female' ? base - 161 : base + 5;
    return Math.round(bmr);
  }

  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * TDEE = BMR * Activity Multiplier
   */
  static calculateTDEE(bmr, activityLevel = 'sedentary') {
    if (!bmr) return null;
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate daily nutritional targets based on goal
   */
  static calculateDailyTargets(tdee, goal = HEALTH_GOALS.MAINTAIN_WEIGHT, weightKg = 70) {
    if (!tdee) return null;

    let targetCalories = tdee;

    switch (goal) {
      case HEALTH_GOALS.LOSE_WEIGHT:
        targetCalories = Math.max(1200, Math.round(tdee - 500)); // 500 kcal deficit
        break;
      case HEALTH_GOALS.GAIN_WEIGHT:
      case HEALTH_GOALS.BUILD_MUSCLE:
        targetCalories = Math.round(tdee + 350); // 350 kcal surplus
        break;
      case HEALTH_GOALS.IMPROVE_ENDURANCE:
      case HEALTH_GOALS.MAINTAIN_WEIGHT:
      default:
        targetCalories = tdee;
        break;
    }

    // Macro Ratios:
    // Protein: 2.0g per kg for muscle/loss, 1.6g for maintain (4 kcal/g)
    // Fat: 25% of total calories (9 kcal/g)
    // Carbs: Remaining calories (4 kcal/g)
    const proteinGrams = Math.round(weightKg * 1.8);
    const proteinCalories = proteinGrams * 4;
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);
    const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbGrams = Math.round(carbCalories / 4);

    // Recommended water intake: 35ml per kg of body weight
    const targetWaterMl = Math.round(weightKg * 35);
    const targetSteps = 8000;
    const targetSleepHours = 8;

    return {
      dailyCalories: targetCalories,
      macros: {
        protein: { grams: proteinGrams, calories: proteinCalories, percentage: Math.round((proteinCalories / targetCalories) * 100) },
        carbs: { grams: carbGrams, calories: carbCalories, percentage: Math.round((carbCalories / targetCalories) * 100) },
        fat: { grams: fatGrams, calories: fatCalories, percentage: Math.round((fatCalories / targetCalories) * 100) }
      },
      waterMl: targetWaterMl,
      steps: targetSteps,
      sleepHours: targetSleepHours
    };
  }
}

module.exports = HealthCalculators;

/**
 * Health Dashboard Controller
 * Aggregates daily charts, health scores, water, sleep, calories burned, and exercise duration
 */

const HealthProfile = require('../models/HealthProfile');
const HealthMetric = require('../models/HealthMetric');
const NutritionLog = require('../models/NutritionLog');
const HealthScoreService = require('../services/healthScoreService');
const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const { getRequestDate } = require('../utils/dateHelper');

class HealthDashboardController {
  /**
   * Get Aggregated Dashboard Health Metrics & Charts
   * GET /api/health/dashboard
   */
  static async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const today = getRequestDate(req);

      const [profile, metrics, nutritionTotals, recentMeals] = await Promise.all([
        HealthProfile.findByUserId(userId),
        HealthMetric.getByDate(userId, today),
        NutritionLog.getDailyTotals(userId, today),
        NutritionLog.findByUserAndDate(userId, today)
      ]);

      const targetCalories = profile?.targets?.dailyCalories || 2000;
      const caloriesConsumed = nutritionTotals.calories || 0;
      const caloriesBurned = metrics.caloriesBurned || metrics.activeCaloriesBurnt || 0;
      const remainingCalories = Math.max(0, targetCalories - caloriesConsumed);

      const targetWater = metrics.targetWaterMl || profile?.targets?.waterMl || 2500;
      const targetSteps = metrics.targetSteps || profile?.targets?.steps || 8000;
      const targetSleep = metrics.targetSleepHours || 8;

      const healthScoreData = HealthScoreService.calculateDailyScore(profile, nutritionTotals, metrics);

      // Fetch 7-day trend data for frontend charts based on today's calendar date
      const [year, month, day] = today.split('-').map(Number);
      const chartDates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(year, month - 1, day - i);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        chartDates.push({ dateKey: `${yStr}-${mStr}-${dStr}`, d });
      }

      const startStr = chartDates[0].dateKey;
      const endStr = chartDates[chartDates.length - 1].dateKey;

      const [metricsList, nutritionList] = await Promise.all([
        HealthMetric.getRange(userId, startStr, endStr),
        NutritionLog.findByUserDateRange(userId, startStr, endStr)
      ]);

      const chartHistory = chartDates.map(({ dateKey, d }) => {
        const dayMetrics = metricsList.find(m => m.date === dateKey) || {
          steps: 0,
          waterMl: 0,
          sleepHours: 0,
          activeCaloriesBurnt: 0,
          workoutMinutes: 0
        };
        const dayNutrition = nutritionList.filter(n => n.date === dateKey);
        const dayCals = dayNutrition.reduce((sum, n) => sum + (n.calories || 0), 0);

        return {
          date: dateKey,
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          waterIntake: dayMetrics.waterMl || dayMetrics.waterIntake || 0,
          sleepHours: dayMetrics.sleepHours || 0,
          caloriesBurned: dayMetrics.activeCaloriesBurnt || dayMetrics.caloriesBurned || 0,
          caloriesConsumed: dayCals,
          exerciseDuration: dayMetrics.workoutMinutes || dayMetrics.exerciseDuration || 0,
          steps: dayMetrics.steps || 0
        };
      });

      const isDailyLogSubmitted = Boolean(
        metrics.isDailyLogSubmitted ||
        (metrics.steps > 0 && (metrics.activeCaloriesBurnt > 0 || metrics.exerciseDuration > 0))
      );

      return ResponseHandler.success(res, 'Health dashboard data retrieved successfully', {
        date: today,
        isDailyLogSubmitted,
        hasLoggedToday: isDailyLogSubmitted,
        user: {
          name: req.user.name,
          email: req.user.email
        },
        healthScore: {
          score: healthScoreData.overallScore,
          status: healthScoreData.status,
          grade: healthScoreData.grade
        },
        metrics: {
          waterIntake: {
            current: metrics.waterMl,
            target: targetWater,
            unit: 'ml',
            percentage: Math.min(100, Math.round((metrics.waterMl / targetWater) * 100))
          },
          sleep: {
            current: metrics.sleepHours,
            target: targetSleep,
            unit: 'hours',
            percentage: Math.min(100, Math.round((metrics.sleepHours / targetSleep) * 100))
          },
          caloriesBurned: {
            current: caloriesBurned,
            unit: 'kcal'
          },
          exerciseDuration: {
            current: metrics.exerciseDuration || metrics.workoutMinutes || 0,
            unit: 'minutes'
          },
          steps: {
            current: metrics.steps,
            target: targetSteps,
            unit: 'steps',
            percentage: Math.min(100, Math.round((metrics.steps / targetSteps) * 100))
          }
        },
        calorieSummary: {
          target: targetCalories,
          consumed: caloriesConsumed,
          remaining: remainingCalories,
          burnt: caloriesBurned,
          netBalance: caloriesConsumed - caloriesBurned
        },
        macroSummary: {
          protein: {
            current: nutritionTotals.protein,
            target: profile?.targets?.macros?.protein?.grams || 120,
            unit: 'g'
          },
          carbs: {
            current: nutritionTotals.carbs,
            target: profile?.targets?.macros?.carbs?.grams || 220,
            unit: 'g'
          },
          fat: {
            current: nutritionTotals.fat,
            target: profile?.targets?.macros?.fat?.grams || 55,
            unit: 'g'
          },
          fiber: {
            current: nutritionTotals.fiber,
            target: 30,
            unit: 'g'
          }
        },
        chartHistory,
        recentMeals
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log daily health metrics (Water, Sleep, Exercise, Calories Burned)
   * POST /api/health/daily-log
   */
  static async logDaily(req, res, next) {
    try {
      const userId = req.user.id;
      const today = getRequestDate(req);

      // Enforce 1 daily log per day rule
      const existing = await HealthMetric.getByDate(userId, today);
      const isAlreadySubmitted = existing && (
        existing.isDailyLogSubmitted ||
        (existing.steps > 0 && (existing.activeCaloriesBurnt > 0 || existing.workoutMinutes > 0))
      );

      if (isAlreadySubmitted) {
        return ResponseHandler.error(
          res,
          'You have already submitted your health log for today. Only one daily log is permitted per day.',
          HTTP_STATUS.CONFLICT
        );
      }

      const logged = await HealthMetric.logDailyMetric(userId, today, {
        ...req.body,
        isDailyLogSubmitted: true,
        dailyLogSubmittedAt: new Date().toISOString()
      });
      return ResponseHandler.success(res, 'Daily health metric logged successfully', logged);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HealthDashboardController;

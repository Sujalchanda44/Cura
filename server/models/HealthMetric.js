/**
 * Health Metric Model (Steps, Water, Sleep, Exercise Duration, Active Calories)
 */

const memoryDb = require('../../database/memoryStore');

class HealthMetric {
  static async getByDate(userId, date) {
    const record = await memoryDb.findOne('healthMetrics', { userId, date });
    if (record) {
      return {
        ...record,
        waterIntake: record.waterMl,
        caloriesBurned: record.activeCaloriesBurnt,
        exerciseDuration: record.workoutMinutes || record.exerciseDuration || 0
      };
    }

    // Return empty defaults for the day if not yet logged
    return {
      userId,
      date,
      steps: 0,
      targetSteps: 8000,
      waterMl: 0,
      waterIntake: 0,
      targetWaterMl: 2500,
      sleepHours: 0,
      targetSleepHours: 8,
      activeCaloriesBurnt: 0,
      caloriesBurned: 0,
      exerciseDuration: 0,
      workoutMinutes: 0,
      weightKg: null,
      heartRateAvg: 70
    };
  }

  static async logDailyMetric(userId, date, updateData) {
    const existing = await memoryDb.findOne('healthMetrics', { userId, date });

    const waterMl = Number(updateData.waterMl !== undefined ? updateData.waterMl : (updateData.waterIntake !== undefined ? updateData.waterIntake : existing?.waterMl || 0));
    const activeCaloriesBurnt = Number(updateData.activeCaloriesBurnt !== undefined ? updateData.activeCaloriesBurnt : (updateData.caloriesBurned !== undefined ? updateData.caloriesBurned : existing?.activeCaloriesBurnt || 0));
    const exerciseDuration = Number(updateData.exerciseDuration !== undefined ? updateData.exerciseDuration : (updateData.workoutMinutes !== undefined ? updateData.workoutMinutes : existing?.workoutMinutes || existing?.exerciseDuration || 0));

    const payload = {
      userId,
      date,
      steps: Number(updateData.steps !== undefined ? updateData.steps : existing?.steps || 0),
      targetSteps: Number(updateData.targetSteps || existing?.targetSteps || 8000),
      waterMl,
      waterIntake: waterMl,
      targetWaterMl: Number(updateData.targetWaterMl || existing?.targetWaterMl || 2500),
      sleepHours: Number(updateData.sleepHours !== undefined ? updateData.sleepHours : existing?.sleepHours || 0),
      targetSleepHours: Number(updateData.targetSleepHours || existing?.targetSleepHours || 8),
      activeCaloriesBurnt,
      caloriesBurned: activeCaloriesBurnt,
      exerciseDuration,
      workoutMinutes: exerciseDuration,
      weightKg: updateData.weightKg !== undefined ? updateData.weightKg : (existing?.weightKg || null),
      heartRateAvg: Number(updateData.heartRateAvg || existing?.heartRateAvg || 70),
      ...updateData
    };

    if (existing) {
      return memoryDb.update('healthMetrics', existing.id, payload);
    } else {
      return memoryDb.create('healthMetrics', payload);
    }
  }

  static async getRange(userId, startDate, endDate) {
    const all = await memoryDb.find('healthMetrics', { userId });
    return all
      .filter(m => m.date >= startDate && m.date <= endDate)
      .map(m => ({
        ...m,
        waterIntake: m.waterMl,
        caloriesBurned: m.activeCaloriesBurnt,
        exerciseDuration: m.workoutMinutes || m.exerciseDuration || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = HealthMetric;


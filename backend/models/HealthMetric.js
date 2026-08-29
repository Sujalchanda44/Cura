/**
 * Health Metric Model (Steps, Water, Sleep, Exercise Duration, Active Calories)
 */

const memoryDb = require('../database/memoryStore');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

class HealthMetric {
  static async getByDate(userId, date) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('userId', userId)
          .eq('date', date)
          .maybeSingle();
        if (!error && data) {
          return {
            ...data,
            waterIntake: data.waterMl,
            caloriesBurned: data.activeCaloriesBurnt,
            exerciseDuration: data.workoutMinutes || data.exerciseDuration || 0
          };
        }
      } catch (err) {
        logger.error('Supabase getByDate error, falling back:', err);
      }
    }

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
    let existing = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('userId', userId)
          .eq('date', date)
          .maybeSingle();
        if (!error && data) existing = data;
      } catch (err) {
        logger.error('Supabase logDailyMetric query error, falling back:', err);
      }
    }
    if (!existing) {
      existing = await memoryDb.findOne('healthMetrics', { userId, date });
    }

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
      heartRateAvg: Number(updateData.heartRateAvg || existing?.heartRateAvg || 70)
    };

    const supabasePayload = {
      userId,
      date,
      steps: payload.steps,
      targetSteps: payload.targetSteps,
      waterMl: payload.waterMl,
      targetWaterMl: payload.targetWaterMl,
      sleepHours: payload.sleepHours,
      targetSleepHours: payload.targetSleepHours,
      activeCaloriesBurnt: payload.activeCaloriesBurnt,
      workoutMinutes: payload.exerciseDuration,
      weightKg: payload.weightKg,
      heartRateAvg: payload.heartRateAvg
    };

    if (isSupabaseConfigured) {
      try {
        let result;
        if (existing && existing.id) {
          result = await supabase
            .from('health_metrics')
            .update(supabasePayload)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('health_metrics')
            .insert([supabasePayload])
            .select()
            .single();
        }
        if (!result.error && result.data) {
          // Sync memoryDb
          const mem = await memoryDb.findOne('healthMetrics', { userId, date });
          if (mem) {
            await memoryDb.update('healthMetrics', mem.id, result.data);
          } else {
            await memoryDb.create('healthMetrics', result.data);
          }
          return result.data;
        }
        if (result.error) logger.error('Supabase write metric failed, falling back:', result.error);
      } catch (err) {
        logger.error('Supabase logDailyMetric write error, falling back:', err);
      }
    }

    const memRecord = await memoryDb.findOne('healthMetrics', { userId, date });
    if (memRecord) {
      return memoryDb.update('healthMetrics', memRecord.id, payload);
    } else {
      return memoryDb.create('healthMetrics', payload);
    }
  }

  static async getRange(userId, startDate, endDate) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('userId', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });
        if (!error && data) {
          return data.map(m => ({
            ...m,
            waterIntake: m.waterMl,
            caloriesBurned: m.activeCaloriesBurnt,
            exerciseDuration: m.workoutMinutes || m.exerciseDuration || 0
          }));
        }
      } catch (err) {
        logger.error('Supabase getRange error, falling back:', err);
      }
    }

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

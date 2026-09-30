/**
 * Health Metric Model (Steps, Water, Sleep, Exercise Duration, Active Calories)
 */

const memoryDb = require('../database/memoryStore');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

const db = supabaseAdmin || supabase;

class HealthMetric {
  static async getByDate(userId, date) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('health_metrics')
          .select('*')
          .eq('userId', userId)
          .eq('date', date)
          .maybeSingle();
        if (!error && data) {
          const isSubmitted = Boolean(
            data.isDailyLogSubmitted || 
            (data.steps > 0 && (data.activeCaloriesBurnt > 0 || data.workoutMinutes > 0))
          );
          return {
            ...data,
            isDailyLogSubmitted: isSubmitted,
            dailyLogSubmittedAt: data.dailyLogSubmittedAt || null,
            waterIntake: data.waterMl,
            caloriesBurned: data.activeCaloriesBurnt,
            exerciseDuration: data.workoutMinutes || data.exerciseDuration || 0,
            bloodPressureSystolic: data.bloodPressureSystolic,
            bloodPressureDiastolic: data.bloodPressureDiastolic,
            restingHeartRate: data.restingHeartRate || data.heartRateAvg,
            oxygenSaturation: data.oxygenSaturation,
            bloodGlucose: data.bloodGlucose,
            glucoseType: data.glucoseType,
            bodyTemperature: data.bodyTemperature
          };
        }
      } catch (err) {
        logger.error('Supabase getByDate error:', err);
      }
      return {
        userId,
        date,
        isDailyLogSubmitted: false,
        dailyLogSubmittedAt: null,
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

    const record = await memoryDb.findOne('healthMetrics', { userId, date });
    if (record) {
      const isSubmitted = Boolean(
        record.isDailyLogSubmitted || 
        (record.steps > 0 && (record.activeCaloriesBurnt > 0 || record.workoutMinutes > 0 || record.exerciseDuration > 0))
      );
      return {
        ...record,
        isDailyLogSubmitted: isSubmitted,
        dailyLogSubmittedAt: record.dailyLogSubmittedAt || null,
        waterIntake: record.waterMl,
        caloriesBurned: record.activeCaloriesBurnt,
        exerciseDuration: record.workoutMinutes || record.exerciseDuration || 0
      };
    }

    // Return empty defaults for the day if not yet logged
    return {
      userId,
      date,
      isDailyLogSubmitted: false,
      dailyLogSubmittedAt: null,
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
      heartRateAvg: Number(updateData.restingHeartRate || updateData.heartRateAvg || existing?.restingHeartRate || existing?.heartRateAvg || 70),
      bloodPressureSystolic: updateData.bloodPressureSystolic !== undefined ? updateData.bloodPressureSystolic : (existing?.bloodPressureSystolic || null),
      bloodPressureDiastolic: updateData.bloodPressureDiastolic !== undefined ? updateData.bloodPressureDiastolic : (existing?.bloodPressureDiastolic || null),
      restingHeartRate: updateData.restingHeartRate !== undefined ? updateData.restingHeartRate : (existing?.restingHeartRate || existing?.heartRateAvg || null),
      oxygenSaturation: updateData.oxygenSaturation !== undefined ? updateData.oxygenSaturation : (existing?.oxygenSaturation || null),
      bloodGlucose: updateData.bloodGlucose !== undefined ? updateData.bloodGlucose : (existing?.bloodGlucose || null),
      glucoseType: updateData.glucoseType || existing?.glucoseType || 'fasting',
      bodyTemperature: updateData.bodyTemperature !== undefined ? updateData.bodyTemperature : (existing?.bodyTemperature || null),
      isDailyLogSubmitted: updateData.isDailyLogSubmitted !== undefined ? Boolean(updateData.isDailyLogSubmitted) : (existing?.isDailyLogSubmitted || false),
      dailyLogSubmittedAt: updateData.dailyLogSubmittedAt || existing?.dailyLogSubmittedAt || (updateData.isDailyLogSubmitted ? new Date().toISOString() : null)
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

    if (isSupabaseConfigured && db) {
      try {
        let result;
        if (existing && existing.id) {
          result = await db
            .from('health_metrics')
            .update(supabasePayload)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await db
            .from('health_metrics')
            .upsert([supabasePayload], { onConflict: '"userId",date' })
            .select()
            .single();
        }
        if (!result.error && result.data) {
          return result.data;
        }
        if (result.error) {
          logger.error('Supabase write metric failed:', result.error);
          throw result.error;
        }
      } catch (err) {
        logger.error('Supabase logDailyMetric write error:', err);
        throw err;
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
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
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
        logger.error('Supabase getRange error:', err);
      }
      return [];
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

/**
 * Nutrition Log Model & Aggregation Methods
 */

const memoryDb = require('../database/memoryStore');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

class NutritionLog {
  static async create(logData) {
    const today = new Date().toISOString().split('T')[0];
    const log = {
      userId: logData.userId,
      date: logData.date || today,
      mealType: logData.mealType || 'snack', // breakfast, lunch, dinner, snack
      name: logData.name,
      calories: Number(logData.calories) || 0,
      protein: Number(logData.protein) || 0,
      carbs: Number(logData.carbs) || 0,
      fat: Number(logData.fat) || 0,
      fiber: Number(logData.fiber) || 0,
      ingredients: Array.isArray(logData.ingredients) ? logData.ingredients : [],
      barcode: logData.barcode || null,
      imageUrl: logData.imageUrl || null
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .insert([log])
          .select()
          .single();
        if (!error && data) {
          // Sync with local memoryDb
          await memoryDb.create('nutritionLogs', data);
          return data;
        }
        if (error) logger.error('Supabase create nutrition log failed, falling back:', error);
      } catch (err) {
        logger.error('Supabase nutritionLogs create error, falling back:', err);
      }
    }

    return memoryDb.create('nutritionLogs', log);
  }

  static async findByUserAndDate(userId, date) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('userId', userId)
          .eq('date', date)
          .order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserAndDate error, falling back:', err);
      }
    }

    const logs = await memoryDb.find('nutritionLogs', { userId, date });
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findByUserDateRange(userId, startDate, endDate) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('userId', userId)
          .gte('date', startDate)
          .lte('date', endDate);
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserDateRange error, falling back:', err);
      }
    }

    const allLogs = await memoryDb.find('nutritionLogs', { userId });
    return allLogs.filter(log => log.date >= startDate && log.date <= endDate);
  }

  static async getDailyTotals(userId, date) {
    const logs = await this.findByUserAndDate(userId, date);
    return logs.reduce(
      (acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        acc.fiber += log.fiber || 0;
        acc.itemsCount += 1;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, itemsCount: 0 }
    );
  }

  static async delete(id, userId) {
    if (isSupabaseConfigured) {
      try {
        const { data: logCheck, error: checkError } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .maybeSingle();
        if (!checkError && logCheck) {
          const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
          if (!error) {
            await memoryDb.delete('nutritionLogs', id);
            return true;
          }
        }
      } catch (err) {
        logger.error('Supabase nutritionLogs delete error, falling back:', err);
      }
    }

    const log = await memoryDb.findById('nutritionLogs', id);
    if (!log || log.userId !== userId) return false;
    return memoryDb.delete('nutritionLogs', id);
  }
}

module.exports = NutritionLog;

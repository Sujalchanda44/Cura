/**
 * Report Model for Storing Generated Health Summaries
 */

const memoryDb = require('../database/memoryStore');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

class Report {
  static async create(reportData) {
    const payload = {
      userId: reportData.userId,
      type: reportData.type, // 'weekly' | 'monthly'
      periodStart: reportData.periodStart,
      periodEnd: reportData.periodEnd,
      summary: reportData.summary,
      healthScoreAverage: reportData.healthScoreAverage,
      nutritionAverage: reportData.nutritionAverage,
      activityAverage: reportData.activityAverage,
      aiInsights: reportData.aiInsights,
      generatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          // Sync with local memoryDb
          await memoryDb.create('reports', data);
          return data;
        }
        if (error) logger.error('Supabase create report failed, falling back:', error);
      } catch (err) {
        logger.error('Supabase reports create error, falling back:', err);
      }
    }

    return memoryDb.create('reports', payload);
  }

  static async findByUserId(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserId error, falling back:', err);
      }
    }

    const list = await memoryDb.find('reports', { userId });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findById error, falling back:', err);
      }
    }
    return memoryDb.findById('reports', id);
  }
}

module.exports = Report;

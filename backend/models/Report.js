/**
 * Report Model for Storing Generated Health Summaries
 */

const memoryDb = require('../database/memoryStore');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

const db = supabaseAdmin || supabase;

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

    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('reports')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          return data;
        }
        if (error) {
          logger.error('Supabase create report failed:', error);
          throw error;
        }
      } catch (err) {
        logger.error('Supabase reports create error:', err);
        throw err;
      }
    }

    return memoryDb.create('reports', payload);
  }

  static async findByUserId(userId) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('reports')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserId error:', err);
      }
      return [];
    }

    const list = await memoryDb.find('reports', { userId });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('reports')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findById error:', err);
      }
      return null;
    }
    return memoryDb.findById('reports', id);
  }
}

module.exports = Report;

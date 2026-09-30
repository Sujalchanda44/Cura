/**
 * Notification & Reminder Model
 */

const memoryDb = require('../database/memoryStore');
const { REMINDER_TYPES } = require('../config/constants');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

const db = supabaseAdmin || supabase;

class Notification {
  static async create(reminderData) {
    const payload = {
      userId: reminderData.userId,
      title: reminderData.title,
      type: reminderData.type || REMINDER_TYPES.GENERAL,
      dosage: reminderData.dosage || null,
      time: reminderData.time, // e.g. "08:30"
      days: reminderData.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      isActive: reminderData.isActive !== false,
      notes: reminderData.notes || ''
    };

    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('notifications')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          return data;
        }
        if (error) {
          logger.error('Supabase create notification failed:', error);
          throw error;
        }
      } catch (err) {
        logger.error('Supabase notifications create error:', err);
        throw err;
      }
    }

    return memoryDb.create('notifications', payload);
  }

  static async findByUserId(userId) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('notifications')
          .select('*')
          .eq('userId', userId)
          .order('time', { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserId error:', err);
      }
      return [];
    }

    const list = await memoryDb.find('notifications', { userId });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }

  static async findById(id) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('notifications')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findById error:', err);
      }
      return null;
    }
    return memoryDb.findById('notifications', id);
  }

  static async toggle(id, userId) {
    const item = await this.findById(id);
    if (!item || item.userId !== userId) return null;
    const newStatus = !item.isActive;

    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('notifications')
          .update({ isActive: newStatus })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          return data;
        }
      } catch (err) {
        logger.error('Supabase notifications toggle error:', err);
      }
      return null;
    }

    return memoryDb.update('notifications', id, { isActive: newStatus });
  }

  static async delete(id, userId) {
    const item = await this.findById(id);
    if (!item || item.userId !== userId) return false;

    if (isSupabaseConfigured && db) {
      try {
        const { error } = await db
          .from('notifications')
          .delete()
          .eq('id', id);
        return !error;
      } catch (err) {
        logger.error('Supabase notifications delete error:', err);
        return false;
      }
    }

    return memoryDb.delete('notifications', id);
  }
}

module.exports = Notification;

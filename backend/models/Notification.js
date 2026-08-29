/**
 * Notification & Reminder Model
 */

const memoryDb = require('../database/memoryStore');
const { REMINDER_TYPES } = require('../config/constants');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

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

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          // Sync with local memoryDb
          await memoryDb.create('notifications', data);
          return data;
        }
        if (error) logger.error('Supabase create notification failed, falling back:', error);
      } catch (err) {
        logger.error('Supabase notifications create error, falling back:', err);
      }
    }

    return memoryDb.create('notifications', payload);
  }

  static async findByUserId(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', userId)
          .order('time', { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByUserId error, falling back:', err);
      }
    }

    const list = await memoryDb.find('notifications', { userId });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }

  static async findById(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findById error, falling back:', err);
      }
    }
    return memoryDb.findById('notifications', id);
  }

  static async toggle(id, userId) {
    const item = await this.findById(id);
    if (!item || item.userId !== userId) return null;
    const newStatus = !item.isActive;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .update({ isActive: newStatus })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          await memoryDb.update('notifications', id, data);
          return data;
        }
      } catch (err) {
        logger.error('Supabase notifications toggle error, falling back:', err);
      }
    }

    return memoryDb.update('notifications', id, { isActive: newStatus });
  }

  static async delete(id, userId) {
    const item = await this.findById(id);
    if (!item || item.userId !== userId) return false;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (!error) {
          await memoryDb.delete('notifications', id);
          return true;
        }
      } catch (err) {
        logger.error('Supabase notifications delete error, falling back:', err);
      }
    }

    return memoryDb.delete('notifications', id);
  }
}

module.exports = Notification;

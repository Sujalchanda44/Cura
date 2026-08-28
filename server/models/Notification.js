/**
 * Notification & Reminder Model
 */

const memoryDb = require('../../database/memoryStore');
const { REMINDER_TYPES } = require('../config/constants');

class Notification {
  static async create(reminderData) {
    return memoryDb.create('notifications', {
      userId: reminderData.userId,
      title: reminderData.title,
      type: reminderData.type || REMINDER_TYPES.GENERAL,
      dosage: reminderData.dosage || null,
      time: reminderData.time, // e.g. "08:30"
      days: reminderData.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      isActive: reminderData.isActive !== false,
      notes: reminderData.notes || ''
    });
  }

  static async findByUserId(userId) {
    const list = await memoryDb.find('notifications', { userId });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }

  static async findById(id) {
    return memoryDb.findById('notifications', id);
  }

  static async toggle(id, userId) {
    const item = await memoryDb.findById('notifications', id);
    if (!item || item.userId !== userId) return null;
    return memoryDb.update('notifications', id, { isActive: !item.isActive });
  }

  static async delete(id, userId) {
    const item = await memoryDb.findById('notifications', id);
    if (!item || item.userId !== userId) return false;
    return memoryDb.delete('notifications', id);
  }
}

module.exports = Notification;

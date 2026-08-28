/**
 * Reminder & Notification Helper Service
 */

const { REMINDER_TYPES } = require('../config/constants');

class ReminderService {
  /**
   * Validate reminder payload
   */
  static validateReminderPayload(data) {
    const errors = [];
    if (!data.title) errors.push('Title is required');
    if (!data.time) errors.push('Time (HH:MM) is required');

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (data.time && !timeRegex.test(data.time)) {
      errors.push('Time must be in 24-hour format HH:MM (e.g. 08:30 or 20:15)');
    }

    if (data.type && !Object.values(REMINDER_TYPES).includes(data.type)) {
      errors.push(`Type must be one of: [${Object.values(REMINDER_TYPES).join(', ')}]`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format reminder for client display
   */
  static formatReminder(reminder) {
    return {
      id: reminder.id,
      title: reminder.title,
      type: reminder.type,
      dosage: reminder.dosage || null,
      time: reminder.time,
      days: reminder.days || ['Daily'],
      isActive: reminder.isActive,
      notes: reminder.notes || '',
      createdAt: reminder.createdAt
    };
  }
}

module.exports = ReminderService;

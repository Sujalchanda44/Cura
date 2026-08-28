/**
 * Notification & Reminder Controller
 * Handles medicine schedules, hydration checks, and workout reminders
 */

const Notification = require('../models/Notification');
const ReminderService = require('../services/reminderService');
const ResponseHandler = require('../utils/responseHandler');
const { REMINDER_TYPES, HTTP_STATUS } = require('../config/constants');

class NotificationController {
  /**
   * Get user's notifications / reminders
   * GET /api/notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const list = await Notification.findByUserId(req.user.id);
      const formatted = list.map(item => ReminderService.formatReminder(item));
      return ResponseHandler.success(res, 'Notifications retrieved successfully', formatted);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Medicine Reminder
   * POST /api/notifications/medicine-reminder
   */
  static async createMedicineReminder(req, res, next) {
    try {
      const { title, dosage, time, days, notes } = req.body;

      const validation = ReminderService.validateReminderPayload({
        title,
        time,
        type: REMINDER_TYPES.MEDICINE
      });

      if (!validation.isValid) {
        return ResponseHandler.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      const reminder = await Notification.create({
        userId: req.user.id,
        title,
        type: REMINDER_TYPES.MEDICINE,
        dosage,
        time,
        days,
        notes
      });

      return ResponseHandler.created(
        res,
        'Medicine reminder created successfully',
        ReminderService.formatReminder(reminder)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Health Reminder (Water, Workout, Sleep)
   * POST /api/notifications/health-reminder
   */
  static async createHealthReminder(req, res, next) {
    try {
      const { title, type, time, days, notes } = req.body;

      const reminderType = type || REMINDER_TYPES.WATER;

      const validation = ReminderService.validateReminderPayload({
        title,
        time,
        type: reminderType
      });

      if (!validation.isValid) {
        return ResponseHandler.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      const reminder = await Notification.create({
        userId: req.user.id,
        title,
        type: reminderType,
        time,
        days,
        notes
      });

      return ResponseHandler.created(
        res,
        'Health reminder created successfully',
        ReminderService.formatReminder(reminder)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle Reminder Active State
   * PATCH /api/notifications/:id/toggle
   */
  static async toggleReminder(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await Notification.toggle(id, req.user.id);

      if (!updated) {
        return ResponseHandler.error(res, 'Reminder not found', HTTP_STATUS.NOT_FOUND);
      }

      return ResponseHandler.success(
        res,
        `Reminder ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        ReminderService.formatReminder(updated)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Reminder
   * DELETE /api/notifications/:id
   */
  static async deleteReminder(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await Notification.delete(id, req.user.id);

      if (!deleted) {
        return ResponseHandler.error(res, 'Reminder not found', HTTP_STATUS.NOT_FOUND);
      }

      return ResponseHandler.success(res, 'Reminder deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;

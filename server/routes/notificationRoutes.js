/**
 * Notification & Reminder Routes
 */

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.post('/medicine-reminder', NotificationController.createMedicineReminder);
router.post('/health-reminder', NotificationController.createHealthReminder);
router.patch('/:id/toggle', NotificationController.toggleReminder);
router.delete('/:id', NotificationController.deleteReminder);

module.exports = router;

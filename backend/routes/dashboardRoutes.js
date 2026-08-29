/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(authenticate);

router.get('/summary', DashboardController.getSummary);
router.get('/health-score', DashboardController.getHealthScore);
router.get('/weekly-report', DashboardController.getWeeklyReport);
router.get('/monthly-report', DashboardController.getMonthlyReport);

module.exports = router;

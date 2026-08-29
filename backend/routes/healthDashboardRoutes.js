/**
 * Health Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const HealthDashboardController = require('../controllers/healthDashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Dashboard endpoints require authentication
router.use(authenticate);

router.get('/dashboard', HealthDashboardController.getDashboard);
router.get('/', HealthDashboardController.getDashboard);
router.post('/daily-log', HealthDashboardController.logDaily);

module.exports = router;

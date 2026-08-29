/**
 * Health Report Routes & PDF Export
 */

const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

// All report routes require authentication
router.use(authenticate);

router.post('/weekly', ReportController.generateWeeklyReport);
router.post('/monthly', ReportController.generateMonthlyReport);
router.get('/download-pdf', ReportController.downloadPdf);

module.exports = router;

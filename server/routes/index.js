/**
 * Central API Router Index
 * Mounts all sub-routers under /api
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const healthProfileRoutes = require('./healthProfileRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const healthDashboardRoutes = require('./healthDashboardRoutes');
const foodRoutes = require('./foodRoutes');
const scannerRoutes = require('./scannerRoutes');
const aiRoutes = require('./aiRoutes');
const chatRoutes = require('./chatRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');

// API Health Check (Public status or authenticated summary)
router.get('/health', (req, res, next) => {
  if (req.headers.authorization) {
    // Authenticated client asking for health metrics
    return healthDashboardRoutes(req, res, next);
  }
  // Public system liveness probe
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    service: 'Cura+ / HealthSync AI Backend REST API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Cura+ Core Routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);
router.use('/profile', userRoutes);
router.use('/health', healthDashboardRoutes);
router.use('/health-profile', healthProfileRoutes);
router.use('/scanner', scannerRoutes);
router.use('/chat', chatRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/food', foodRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;


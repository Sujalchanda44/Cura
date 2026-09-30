/**
 * Express Application Configuration & Middleware Setup
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// 2. Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static Files (Uploads directory)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 4. Request Logging in development
if (config.env === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color = status >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(`\x1b[36m[HTTP]\x1b[0m ${req.method} ${req.originalUrl} ${color}${status}\x1b[0m - ${duration}ms`);
    });
    next();
  });
}

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to HealthSync AI Backend API',
    documentation: '/docs',
    healthCheck: '/api/health',
    version: '1.0.0'
  });
});

// 5. Mount Main API Routes
// Standard endpoint prefix: /api
app.use('/api', apiRoutes);

// Resilient fallback mount at root level:
// Handles production deployments where VITE_API_URL was set without '/api' (e.g., https://cura-backend.onrender.com)
app.use(apiRoutes);

// 6. Error & Not-Found Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

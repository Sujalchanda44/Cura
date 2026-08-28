/**
 * AI Assistant Routes (Gemini Integration)
 */

const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

// Validation Schemas
const chatSchema = {
  message: { required: true, minLength: 1 }
};

// All AI routes require authentication
router.use(authenticate);

router.post('/chat', validate(chatSchema), AIController.chat);
router.get('/health-advice', AIController.getHealthAdvice);
router.post('/meal-recommendation', AIController.getMealRecommendation);

module.exports = router;

/**
 * Recommendations Routes
 */

const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');

// Require authentication for personalized recommendations
router.use(authenticate);

router.get('/', RecommendationController.getRecommendations);
router.post('/ai-suggest', RecommendationController.getAISuggestions);
router.post('/log-meal', RecommendationController.logMeal);
router.get('/logged-today', RecommendationController.getLoggedMealsToday);
router.post('/custom', RecommendationController.getCustomRecommendation);

module.exports = router;

/**
 * Health Profile Routes
 */

const express = require('express');
const router = express.Router();
const HealthProfileController = require('../controllers/healthProfileController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { ACTIVITY_LEVELS, HEALTH_GOALS, GENDER } = require('../config/constants');

// Validation Schemas
const profileSchema = {
  heightCm: { required: true, type: 'number', min: 50, max: 280 },
  weightKg: { required: true, type: 'number', min: 20, max: 400 },
  age: { required: true, type: 'number', min: 10, max: 120 },
  gender: { required: true, enum: Object.values(GENDER) },
  activityLevel: { required: true, enum: Object.values(ACTIVITY_LEVELS) },
  healthGoal: { required: true, enum: Object.values(HEALTH_GOALS) }
};

// All health profile routes require authentication
router.use(authenticate);

router.post('/', validate(profileSchema), HealthProfileController.saveProfile);
router.put('/', HealthProfileController.saveProfile);
router.get('/', HealthProfileController.getProfile);
router.delete('/', HealthProfileController.deleteProfile);

module.exports = router;

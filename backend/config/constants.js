/**
 * HealthSync AI System Constants
 */

const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM_USER: 'premium_user'
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

const ACTIVITY_LEVELS = {
  SEDENTARY: 'sedentary',         // Little or no exercise
  LIGHTLY_ACTIVE: 'lightly_active', // 1-3 days/week
  MODERATELY_ACTIVE: 'moderately_active', // 3-5 days/week
  VERY_ACTIVE: 'very_active',     // 6-7 days/week
  EXTRA_ACTIVE: 'extra_active'    // Very intense exercise / physical job
};

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9
};

const HEALTH_GOALS = {
  LOSE_WEIGHT: 'lose_weight',
  MAINTAIN_WEIGHT: 'maintain_weight',
  GAIN_WEIGHT: 'gain_weight',
  BUILD_MUSCLE: 'build_muscle',
  IMPROVE_ENDURANCE: 'improve_endurance'
};

const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

const REMINDER_TYPES = {
  MEDICINE: 'medicine',
  WATER: 'water',
  WORKOUT: 'workout',
  MEAL: 'meal',
  SLEEP: 'sleep',
  GENERAL: 'general'
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required. Please provide a valid access token.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  USER_EXISTS: 'An account with this email address already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Access token expired. Please refresh your session.',
  INVALID_TOKEN: 'Invalid or malformed token.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Request validation failed.',
  INTERNAL_ERROR: 'An unexpected internal server error occurred.'
};

module.exports = {
  ROLES,
  HTTP_STATUS,
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  HEALTH_GOALS,
  GENDER,
  REMINDER_TYPES,
  ERROR_MESSAGES
};

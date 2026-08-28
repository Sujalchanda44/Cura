/**
 * HealthSync AI - Initial Seed Data
 * Automatically bootstraps demo accounts and test data for seamless testing
 */

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = require('../server/node_modules/bcryptjs');
}
const memoryDb = require('./memoryStore');
const { ROLES, ACTIVITY_LEVELS, HEALTH_GOALS, REMINDER_TYPES } = require('../server/config/constants');
const HealthCalculators = require('../server/utils/healthCalculators');
const logger = require('../server/utils/logger');

async function seedDatabase() {
  try {
    // Clear existing
    memoryDb.clear();

    const hashedPasswordAdmin = await bcrypt.hash('Admin@123456', 10);
    const hashedPasswordUser = await bcrypt.hash('User@123456', 10);

    // 1. Create Demo Admin
    const adminUser = await memoryDb.create('users', {
      id: 'usr_admin_001',
      name: 'System Administrator',
      email: 'admin@healthsync.ai',
      password: hashedPasswordAdmin,
      role: ROLES.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      isVerified: true
    });

    // 2. Create Demo User
    const demoUser = await memoryDb.create('users', {
      id: 'usr_demo_002',
      name: 'John Doe',
      email: 'john@healthsync.ai',
      password: hashedPasswordUser,
      role: ROLES.USER,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      isVerified: true
    });

    // 3. Create Health Profile for Demo User
    const height = 178; // cm
    const weight = 74;  // kg
    const age = 28;
    const gender = 'male';
    const activityLevel = ACTIVITY_LEVELS.MODERATELY_ACTIVE;
    const healthGoal = HEALTH_GOALS.LOSE_WEIGHT;

    const bmi = HealthCalculators.calculateBMI(weight, height);
    const bmiCategory = HealthCalculators.getBMICategory(bmi);
    const bmr = HealthCalculators.calculateBMR(weight, height, age, gender);
    const tdee = HealthCalculators.calculateTDEE(bmr, activityLevel);
    const targets = HealthCalculators.calculateDailyTargets(tdee, healthGoal, weight);

    await memoryDb.create('healthProfiles', {
      id: 'hp_demo_002',
      userId: demoUser.id,
      heightCm: height,
      height,
      weightKg: weight,
      weight,
      age,
      gender,
      bloodType: 'O+',
      activityLevel,
      healthGoal,
      healthGoals: [healthGoal],
      allergies: ['Peanuts', 'Shellfish'],
      dietaryRestrictions: ['Low Lactose'],
      medicalConditions: ['Mild Asthma'],
      isOnboarded: true,
      bmi,
      bmiCategory,
      bmr,
      tdee,
      targets
    });

    // 4. Create Today's Health Metrics
    const today = new Date().toISOString().split('T')[0];
    await memoryDb.create('healthMetrics', {
      id: 'hm_demo_today',
      userId: demoUser.id,
      date: today,
      steps: 7420,
      targetSteps: targets.steps,
      waterMl: 2100,
      waterIntake: 2100,
      targetWaterMl: targets.waterMl,
      sleepHours: 7.5,
      targetSleepHours: targets.sleepHours,
      activeCaloriesBurnt: 430,
      caloriesBurned: 430,
      exerciseDuration: 45,
      workoutMinutes: 45,
      heartRateAvg: 72,
      bloodPressure: { systolic: 118, diastolic: 76 }
    });

    // 5. Create Sample Nutrition Logs for Today
    await memoryDb.create('nutritionLogs', {
      id: 'nl_demo_001',
      userId: demoUser.id,
      date: today,
      mealType: 'breakfast',
      name: 'Oatmeal with Blueberries & Almond Milk',
      calories: 340,
      protein: 12,
      carbs: 58,
      fat: 7,
      fiber: 8,
      ingredients: ['Rolled Oats', 'Blueberries', 'Almond Milk', 'Chia Seeds']
    });

    await memoryDb.create('nutritionLogs', {
      id: 'nl_demo_002',
      userId: demoUser.id,
      date: today,
      mealType: 'lunch',
      name: 'Grilled Chicken Breast with Quinoa and Steamed Broccoli',
      calories: 520,
      protein: 48,
      carbs: 45,
      fat: 12,
      fiber: 6,
      ingredients: ['Chicken Breast', 'Quinoa', 'Broccoli', 'Olive Oil']
    });

    await memoryDb.create('nutritionLogs', {
      id: 'nl_demo_003',
      userId: demoUser.id,
      date: today,
      mealType: 'snack',
      name: 'Greek Yogurt with Honey',
      calories: 180,
      protein: 15,
      carbs: 22,
      fat: 3,
      fiber: 0,
      ingredients: ['Greek Yogurt', 'Honey']
    });

    // 6. Create Demo Reminders / Notifications
    await memoryDb.create('notifications', {
      id: 'notif_001',
      userId: demoUser.id,
      title: 'Multivitamin Complex',
      type: REMINDER_TYPES.MEDICINE,
      dosage: '1 Tablet',
      time: '08:30',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      isActive: true,
      notes: 'Take after breakfast with water'
    });

    await memoryDb.create('notifications', {
      id: 'notif_002',
      userId: demoUser.id,
      title: 'Hydration Check',
      type: REMINDER_TYPES.WATER,
      dosage: '500ml Water',
      time: '14:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      isActive: true,
      notes: 'Drink a full glass of water'
    });

    logger.success('Database initialized with default seed accounts:');
    logger.info('  - Admin Account: admin@healthsync.ai / Admin@123456');
    logger.info('  - User Account:  john@healthsync.ai / User@123456');
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
}

module.exports = { seedDatabase };

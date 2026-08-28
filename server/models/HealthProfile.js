/**
 * Health Profile Model & Metrics Computation
 */

const memoryDb = require('../../database/memoryStore');
const HealthCalculators = require('../utils/healthCalculators');
const CryptoHelper = require('../utils/cryptoHelper');
const { ACTIVITY_LEVELS, HEALTH_GOALS, GENDER } = require('../config/constants');

class HealthProfile {
  static async findByUserId(userId) {
    const profile = await memoryDb.findOne('healthProfiles', { userId });
    if (!profile) return null;

    // Decrypt sensitive medical data if encrypted
    if (profile.medicalConditionsEncrypted) {
      profile.medicalConditions = CryptoHelper.decrypt(profile.medicalConditionsEncrypted, true) || profile.medicalConditions || [];
    }

    return profile;
  }

  static async createOrUpdate(userId, profileData) {
    const existing = await this.findByUserId(userId);

    // Support both height / heightCm, weight / weightKg, healthGoals / healthGoal
    const heightCm = Number(profileData.heightCm || profileData.height || existing?.heightCm || 170);
    const weightKg = Number(profileData.weightKg || profileData.weight || existing?.weightKg || 70);
    const age = Number(profileData.age || existing?.age || 25);
    const gender = profileData.gender || existing?.gender || GENDER.MALE;
    const activityLevel = profileData.activityLevel || existing?.activityLevel || ACTIVITY_LEVELS.SEDENTARY;
    
    // Normalize health goals (support string or array)
    let healthGoal = profileData.healthGoal || existing?.healthGoal || HEALTH_GOALS.MAINTAIN_WEIGHT;
    let healthGoals = profileData.healthGoals || (Array.isArray(healthGoal) ? healthGoal : [healthGoal]);
    if (Array.isArray(healthGoal)) {
      healthGoal = healthGoal[0] || HEALTH_GOALS.MAINTAIN_WEIGHT;
    }

    const bloodType = profileData.bloodType || existing?.bloodType || 'O+';
    const allergies = Array.isArray(profileData.allergies) 
      ? profileData.allergies 
      : (typeof profileData.allergies === 'string' ? profileData.allergies.split(',').map(s => s.trim()).filter(Boolean) : existing?.allergies || []);
    
    const dietaryRestrictions = Array.isArray(profileData.dietaryRestrictions)
      ? profileData.dietaryRestrictions
      : (typeof profileData.dietaryRestrictions === 'string' ? profileData.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : existing?.dietaryRestrictions || []);

    const rawMedicalConditions = profileData.medicalConditions !== undefined
      ? (Array.isArray(profileData.medicalConditions) ? profileData.medicalConditions : [profileData.medicalConditions].filter(Boolean))
      : existing?.medicalConditions || [];

    // Encrypt sensitive medical records for HIPAA/privacy compliance
    const medicalConditionsEncrypted = CryptoHelper.encrypt(rawMedicalConditions);

    // Calculate core health formulas
    const bmi = HealthCalculators.calculateBMI(weightKg, heightCm);
    const bmiCategory = HealthCalculators.getBMICategory(bmi);
    const bmr = HealthCalculators.calculateBMR(weightKg, heightCm, age, gender);
    const tdee = HealthCalculators.calculateTDEE(bmr, activityLevel);
    const targets = HealthCalculators.calculateDailyTargets(tdee, healthGoal, weightKg);

    const fullRecord = {
      userId,
      heightCm,
      height: heightCm,
      weightKg,
      weight: weightKg,
      age,
      gender,
      bloodType,
      activityLevel,
      healthGoal,
      healthGoals,
      allergies,
      dietaryRestrictions,
      medicalConditions: rawMedicalConditions,
      medicalConditionsEncrypted,
      isOnboarded: true,
      bmi,
      bmiCategory,
      bmr,
      tdee,
      targets
    };

    if (existing) {
      return memoryDb.update('healthProfiles', existing.id, fullRecord);
    } else {
      return memoryDb.create('healthProfiles', fullRecord);
    }
  }

  static async deleteByUserId(userId) {
    const existing = await this.findByUserId(userId);
    if (!existing) return false;
    return memoryDb.delete('healthProfiles', existing.id);
  }
}

module.exports = HealthProfile;


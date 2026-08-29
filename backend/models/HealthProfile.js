/**
 * Health Profile Model & Metrics Computation
 */

const memoryDb = require('../database/memoryStore');
const HealthCalculators = require('../utils/healthCalculators');
const CryptoHelper = require('../utils/cryptoHelper');
const { ACTIVITY_LEVELS, HEALTH_GOALS, GENDER } = require('../config/constants');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

class HealthProfile {
  static async findByUserId(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_profiles')
          .select('*')
          .eq('userId', userId)
          .maybeSingle();
        if (!error && data) {
          // Decrypt sensitive medical data if encrypted
          if (data.medicalConditionsEncrypted) {
            data.medicalConditions = CryptoHelper.decrypt(data.medicalConditionsEncrypted, true) || data.medicalConditions || [];
          }
          return data;
        }
      } catch (err) {
        logger.error('Supabase findByUserId error, falling back:', err);
      }
    }

    const profile = await memoryDb.findOne('healthProfiles', { userId });
    if (!profile) return null;

    // Decrypt sensitive medical data if encrypted
    if (profile.medicalConditionsEncrypted) {
      profile.medicalConditions = CryptoHelper.decrypt(profile.medicalConditionsEncrypted, true) || profile.medicalConditions || [];
    }

    return profile;
  }

  static async createOrUpdate(userId, profileData) {
    let existing = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_profiles')
          .select('*')
          .eq('userId', userId)
          .maybeSingle();
        if (!error && data) existing = data;
      } catch (err) {
        logger.error('Supabase findByUserId query error, falling back:', err);
      }
    }
    if (!existing) {
      existing = await memoryDb.findOne('healthProfiles', { userId });
    }

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

    if (isSupabaseConfigured) {
      try {
        let result;
        if (existing && existing.id) {
          result = await supabase
            .from('health_profiles')
            .update(fullRecord)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('health_profiles')
            .insert([fullRecord])
            .select()
            .single();
        }
        if (!result.error && result.data) {
          // Sync memoryDb
          const mem = await memoryDb.findOne('healthProfiles', { userId });
          if (mem) {
            await memoryDb.update('healthProfiles', mem.id, result.data);
          } else {
            await memoryDb.create('healthProfiles', result.data);
          }
          return result.data;
        }
        if (result.error) logger.error('Supabase write profile failed, falling back:', result.error);
      } catch (err) {
        logger.error('Supabase createOrUpdate error, falling back:', err);
      }
    }

    if (existing) {
      return memoryDb.update('healthProfiles', existing.id, fullRecord);
    } else {
      return memoryDb.create('healthProfiles', fullRecord);
    }
  }

  static async deleteByUserId(userId) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('health_profiles')
          .delete()
          .eq('userId', userId);
        if (!error) {
          const existing = await memoryDb.findOne('healthProfiles', { userId });
          if (existing) await memoryDb.delete('healthProfiles', existing.id);
          return true;
        }
      } catch (err) {
        logger.error('Supabase deleteByUserId error, falling back:', err);
      }
    }
    const existing = await memoryDb.findOne('healthProfiles', { userId });
    if (!existing) return false;
    return memoryDb.delete('healthProfiles', existing.id);
  }
}

module.exports = HealthProfile;

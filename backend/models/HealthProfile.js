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
          const onboardingData = (data.settings && typeof data.settings === 'object') 
            ? (data.settings.onboardingData || {}) 
            : {};
          
          const combined = {
            ...onboardingData,
            ...data,
            isOnboarded: data.isOnboarded !== undefined ? Boolean(data.isOnboarded) : true,
          };

          // Decrypt sensitive medical data if encrypted
          if (data.medicalConditionsEncrypted) {
            combined.medicalConditions = CryptoHelper.decrypt(data.medicalConditionsEncrypted, true) || combined.medicalConditions || [];
          }
          return combined;
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

    // Core measurements & demographics
    const heightCm = Number(profileData.heightCm || profileData.height || existing?.heightCm || 170);
    const weightKg = Number(profileData.weightKg || profileData.weight || existing?.weightKg || 70);
    const age = Number(profileData.age || existing?.age || 25);
    const gender = profileData.gender || existing?.gender || GENDER.MALE;
    const dateOfBirth = profileData.dateOfBirth || existing?.dateOfBirth || null;
    const bloodType = profileData.bloodType || profileData.bloodGroup || existing?.bloodType || 'O+';
    const location = profileData.location || existing?.location || {
      country: profileData.country || existing?.country || '',
      state: profileData.state || existing?.state || '',
      city: profileData.city || existing?.city || '',
    };
    
    // Clinical Vitals & Measurements
    const measurements = {
      bloodPressureSystolic: profileData.bloodPressureSystolic ?? profileData.measurements?.bloodPressureSystolic ?? existing?.measurements?.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: profileData.bloodPressureDiastolic ?? profileData.measurements?.bloodPressureDiastolic ?? existing?.measurements?.bloodPressureDiastolic ?? null,
      restingHeartRate: profileData.restingHeartRate ?? profileData.measurements?.restingHeartRate ?? existing?.measurements?.restingHeartRate ?? null,
      oxygenSaturation: profileData.oxygenSaturation ?? profileData.measurements?.oxygenSaturation ?? existing?.measurements?.oxygenSaturation ?? null,
      bloodGlucose: profileData.bloodGlucose ?? profileData.measurements?.bloodGlucose ?? existing?.measurements?.bloodGlucose ?? null,
      glucoseType: profileData.glucoseType ?? profileData.measurements?.glucoseType ?? existing?.measurements?.glucoseType ?? 'fasting',
      bodyTemperature: profileData.bodyTemperature ?? profileData.measurements?.bodyTemperature ?? existing?.measurements?.bodyTemperature ?? null,
      notes: profileData.measurementsNotes ?? profileData.measurements?.notes ?? existing?.measurements?.notes ?? '',
    };

    // Lifestyle & daily habits
    const activityLevel = profileData.activityLevel || existing?.activityLevel || ACTIVITY_LEVELS.SEDENTARY;
    const exerciseFrequency = profileData.exerciseFrequency || profileData.lifestyle?.exerciseFrequency || existing?.lifestyle?.exerciseFrequency || 'never';
    const sleepHours = profileData.sleepHours || profileData.lifestyle?.sleepHours || existing?.lifestyle?.sleepHours || '7-8 hours';
    const sleepQuality = profileData.sleepQuality || profileData.lifestyle?.sleepQuality || existing?.lifestyle?.sleepQuality || 'Good';
    const dietType = profileData.dietType || profileData.lifestyle?.dietType || existing?.lifestyle?.dietType || 'Non-vegetarian';
    const waterIntake = profileData.waterIntake || profileData.lifestyle?.waterIntake || existing?.lifestyle?.waterIntake || '2.5 Liters';
    const smoking = profileData.smoking || profileData.lifestyle?.smoking || existing?.lifestyle?.smoking || 'never';
    const alcohol = profileData.alcohol || profileData.lifestyle?.alcohol || existing?.lifestyle?.alcohol || 'never';
    const stressLevel = profileData.stressLevel || profileData.lifestyle?.stressLevel || existing?.lifestyle?.stressLevel || 3;

    // Structured Medical History
    const pastConditions = Array.isArray(profileData.pastConditions)
      ? profileData.pastConditions
      : existing?.pastConditions || [];

    // Surgeries & Hospitalizations
    const surgeries = Array.isArray(profileData.surgeries)
      ? profileData.surgeries
      : existing?.surgeries || [];

    // Structured Allergies: { medication: [], food: [], environmental: [] }
    const structuredAllergies = profileData.structuredAllergies || existing?.structuredAllergies || {
      medication: Array.isArray(profileData.medicationAllergies) ? profileData.medicationAllergies : (existing?.structuredAllergies?.medication || []),
      food: Array.isArray(profileData.foodAllergies) ? profileData.foodAllergies : (existing?.structuredAllergies?.food || []),
      environmental: Array.isArray(profileData.environmentalAllergies) ? profileData.environmentalAllergies : (existing?.structuredAllergies?.environmental || []),
    };

    // Flattened allergy string array for legacy backward compatibility
    const allergies = Array.isArray(profileData.allergies) 
      ? profileData.allergies 
      : [
          ...(structuredAllergies.food || []).map(f => typeof f === 'string' ? f : f.name),
          ...(structuredAllergies.medication || []).map(m => typeof m === 'string' ? m : m.name),
          ...(structuredAllergies.environmental || []).map(e => typeof e === 'string' ? e : e.name),
        ].filter(Boolean);

    // Current Medications & Supplements
    const medicationsList = Array.isArray(profileData.medicationsList)
      ? profileData.medicationsList
      : existing?.medicationsList || [];

    // Family Medical History
    const familyHistoryList = Array.isArray(profileData.familyHistoryList)
      ? profileData.familyHistoryList
      : existing?.familyHistoryList || [];

    // Women's / Reproductive Health (Optional)
    const reproductiveHealth = profileData.reproductiveHealth || existing?.reproductiveHealth || null;

    // Emergency Contact & General Notes
    const emergencyContact = profileData.emergencyContact || existing?.emergencyContact || {
      name: '',
      phone: '',
      relation: '',
    };
    const healthConcerns = profileData.healthConcerns || existing?.healthConcerns || '';
    const mainHealthGoal = profileData.mainHealthGoal || profileData.healthGoal || existing?.mainHealthGoal || 'general_wellness';

    // Normalize health goals (support string or array)
    let healthGoal = mainHealthGoal;
    let healthGoals = profileData.healthGoals || (Array.isArray(healthGoal) ? healthGoal : [healthGoal]);
    if (Array.isArray(healthGoal)) {
      healthGoal = healthGoal[0] || HEALTH_GOALS.MAINTAIN_WEIGHT;
    }

    const dietaryRestrictions = Array.isArray(profileData.dietaryRestrictions)
      ? profileData.dietaryRestrictions
      : (typeof profileData.dietaryRestrictions === 'string' ? profileData.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : existing?.dietaryRestrictions || []);

    const rawMedicalConditions = profileData.medicalConditions !== undefined
      ? (Array.isArray(profileData.medicalConditions) ? profileData.medicalConditions : [profileData.medicalConditions].filter(Boolean))
      : (pastConditions.length > 0 ? pastConditions.map(c => typeof c === 'string' ? c : c.condition) : (existing?.medicalConditions || []));

    // Encrypt sensitive medical records for HIPAA/privacy compliance
    const medicalConditionsEncrypted = CryptoHelper.encrypt({
      rawMedicalConditions,
      pastConditions,
      surgeries,
      medicationsList,
      structuredAllergies,
      reproductiveHealth
    });

    // Calculate core health formulas
    const bmi = HealthCalculators.calculateBMI(weightKg, heightCm);
    const bmiCategory = HealthCalculators.getBMICategory(bmi);
    const bmr = HealthCalculators.calculateBMR(weightKg, heightCm, age, gender);
    const tdee = HealthCalculators.calculateTDEE(bmr, activityLevel);
    const targets = HealthCalculators.calculateDailyTargets(tdee, healthGoal, weightKg);

    // Calculate profile completion percentage
    let completedFields = 0;
    let totalFields = 10;
    if (age && heightCm && weightKg && gender) completedFields++; // basic
    if (measurements.bloodPressureSystolic || measurements.restingHeartRate || measurements.bloodGlucose) completedFields++; // measurements
    if (pastConditions.length > 0 || (profileData.hasMedicalConditions !== undefined)) completedFields++; // history
    if (surgeries.length >= 0 && profileData.hasSurgeries !== undefined) completedFields++; // surgeries
    if (allergies.length >= 0 && profileData.hasAllergies !== undefined) completedFields++; // allergies
    if (medicationsList.length >= 0 && profileData.hasMedications !== undefined) completedFields++; // meds
    if (exerciseFrequency && sleepQuality && dietType) completedFields++; // lifestyle
    if (familyHistoryList.length >= 0) completedFields++; // family
    if (mainHealthGoal) completedFields++; // goals
    if (emergencyContact.name || emergencyContact.phone) completedFields++; // emergency
    const completionPercentage = Math.min(100, Math.round((completedFields / totalFields) * 100)) || 85;

    const fullRecord = {
      userId,
      heightCm,
      height: heightCm,
      weightKg,
      weight: weightKg,
      age,
      dateOfBirth,
      gender,
      bloodType,
      bloodGroup: bloodType,
      location,
      country: location.country,
      state: location.state,
      city: location.city,
      measurements,
      lifestyle: {
        activityLevel,
        exerciseFrequency,
        sleepHours,
        sleepQuality,
        dietType,
        waterIntake,
        smoking,
        alcohol,
        stressLevel
      },
      activityLevel,
      healthGoal,
      mainHealthGoal,
      healthGoals,
      allergies,
      structuredAllergies,
      dietaryRestrictions,
      medicalConditions: rawMedicalConditions,
      pastConditions,
      surgeries,
      medicationsList,
      medications: typeof profileData.medications === 'string' ? profileData.medications : (medicationsList.map(m => m.name).join(', ')),
      familyHistoryList,
      familyHistory: typeof profileData.familyHistory === 'string' ? profileData.familyHistory : (familyHistoryList.map(f => `${f.condition} (${f.relationship})`).join(', ')),
      reproductiveHealth,
      emergencyContact,
      healthConcerns,
      medicalConditionsEncrypted,
      isOnboarded: true,
      completionPercentage,
      consentAccepted: true,
      consentTimestamp: new Date().toISOString(),
      bmi,
      bmiCategory,
      bmr,
      tdee,
      targets
    };

    // Consolidate rich onboarding fields into settings.onboardingData (JSONB)
    const existingSettings = (existing?.settings && typeof existing.settings === 'object') ? existing.settings : {};
    const consolidatedSettings = {
      ...existingSettings,
      onboardingData: {
        dateOfBirth,
        bloodGroup: bloodType,
        location,
        country: location.country,
        state: location.state,
        city: location.city,
        measurements,
        lifestyle: fullRecord.lifestyle,
        mainHealthGoal,
        structuredAllergies,
        pastConditions,
        surgeries,
        medicationsList,
        medications: fullRecord.medications,
        familyHistoryList,
        familyHistory: fullRecord.familyHistory,
        reproductiveHealth,
        emergencyContact,
        healthConcerns,
        completionPercentage,
        consentAccepted: true,
        consentTimestamp: new Date().toISOString()
      }
    };
    fullRecord.settings = consolidatedSettings;

    // Exact schema columns supported by Supabase public.health_profiles table
    const SUPABASE_ALLOWED_COLUMNS = new Set([
      'id', 'userId', 'heightCm', 'height', 'weightKg', 'weight',
      'age', 'gender', 'bloodType', 'activityLevel', 'healthGoal',
      'healthGoals', 'allergies', 'dietaryRestrictions',
      'medicalConditions', 'medicalConditionsEncrypted',
      'isOnboarded', 'bmi', 'bmiCategory', 'bmr', 'tdee',
      'targets', 'settings', 'createdAt', 'updatedAt'
    ]);

    if (isSupabaseConfigured) {
      try {
        const supabasePayload = {};
        for (const [key, val] of Object.entries(fullRecord)) {
          if (SUPABASE_ALLOWED_COLUMNS.has(key)) {
            supabasePayload[key] = val;
          }
        }
        supabasePayload.settings = consolidatedSettings;
        supabasePayload.isOnboarded = profileData.isOnboarded !== undefined ? Boolean(profileData.isOnboarded) : true;
        supabasePayload.updatedAt = new Date().toISOString();

        let result;
        if (existing && existing.id) {
          result = await supabase
            .from('health_profiles')
            .update(supabasePayload)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('health_profiles')
            .insert([supabasePayload])
            .select()
            .single();
        }
        if (!result.error && result.data) {
          // Sync memoryDb
          const mem = await memoryDb.findOne('healthProfiles', { userId });
          if (mem) {
            await memoryDb.update('healthProfiles', mem.id, fullRecord);
          } else {
            await memoryDb.create('healthProfiles', { ...fullRecord, id: result.data.id });
          }
          return { ...fullRecord, ...result.data, ...consolidatedSettings.onboardingData, isOnboarded: true };
        }
        if (result.error) logger.error('Supabase write profile failed, falling back:', result.error);
      } catch (err) {
        logger.error('Supabase createOrUpdate error, falling back:', err);
      }
    }

    // In-memory fallback
    const mem = await memoryDb.findOne('healthProfiles', { userId });
    if (mem) {
      return memoryDb.update('healthProfiles', mem.id, fullRecord);
    } else {
      return memoryDb.create('healthProfiles', fullRecord);
    }
  }

  static async saveDraft(userId, draftData) {
    const draftPayload = {
      userId,
      step: draftData.step || 1,
      completionPercentage: draftData.completionPercentage || 0,
      data: draftData,
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('health_profiles')
          .select('id, settings')
          .eq('userId', userId)
          .maybeSingle();

        if (existing) {
          const updatedSettings = {
            ...(existing.settings || {}),
            onboardingDraft: draftPayload
          };
          await supabase
            .from('health_profiles')
            .update({ settings: updatedSettings, updatedAt: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('health_profiles')
            .insert([{
              userId,
              isOnboarded: false,
              settings: { onboardingDraft: draftPayload }
            }]);
        }
      } catch (err) {
        logger.error('Supabase saveDraft error, falling back:', err);
      }
    }

    const existingMem = await memoryDb.findOne('healthProfiles', { userId });
    if (existingMem) {
      await memoryDb.update('healthProfiles', existingMem.id, {
        settings: { ...(existingMem.settings || {}), onboardingDraft: draftPayload }
      });
    } else {
      await memoryDb.create('healthProfiles', {
        userId,
        isOnboarded: false,
        settings: { onboardingDraft: draftPayload }
      });
    }

    return draftPayload;
  }

  static async getDraft(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('health_profiles')
          .select('settings, isOnboarded')
          .eq('userId', userId)
          .maybeSingle();

        if (!error && data?.settings?.onboardingDraft) {
          return data.settings.onboardingDraft;
        }
      } catch (err) {
        logger.error('Supabase getDraft error, falling back:', err);
      }
    }

    const mem = await memoryDb.findOne('healthProfiles', { userId });
    return mem?.settings?.onboardingDraft || null;
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

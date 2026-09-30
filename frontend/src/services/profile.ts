import { supabase } from '@/api/supabase';
import { apiClient } from '@/api/apiClient';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
  isNewRegistration?: boolean;
}

export interface PastConditionItem {
  condition: string;
  yearDiagnosed?: string;
  isActive?: boolean;
  isReceivingTreatment?: boolean;
  notes?: string;
}

export interface SurgeryItem {
  surgeryName: string;
  year?: string;
  reason?: string;
  duration?: string;
  complications?: string;
}

export interface AllergyItem {
  name: string;
  reaction: string;
}

export interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
  reason?: string;
  startDate?: string;
  isPrescribed?: boolean;
}

export interface FamilyHistoryItem {
  condition: string;
  relationship: string;
}

export interface ReproductiveHealth {
  pregnancyStatus?: string;
  menstrualCycle?: string;
  lastMenstrualPeriod?: string;
  pcosHistory?: boolean | string;
  pregnancyHistory?: string;
  menopauseStatus?: string;
}

export interface MeasurementsData {
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  restingHeartRate?: number | null;
  oxygenSaturation?: number | null;
  bloodGlucose?: number | null;
  glucoseType?: 'fasting' | 'random' | 'other';
  bodyTemperature?: number | null;
  notes?: string;
}

export interface OnboardingData {
  language?: string;
  name: string;
  dateOfBirth?: string;
  age: number;
  gender: string;
  biologicalSex?: string;
  genderIdentity?: string;
  heightCm: number;
  weightKg: number;
  bloodGroup: string;
  bloodType?: string;
  country?: string;
  state?: string;
  city?: string;
  
  // Step 2 Measurements
  measurements?: MeasurementsData;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  restingHeartRate?: number | null;
  oxygenSaturation?: number | null;
  bloodGlucose?: number | null;
  glucoseType?: string;
  bodyTemperature?: number | null;

  // Step 3 Medical history
  hasMedicalConditions?: boolean;
  pastConditions?: PastConditionItem[];
  medicalConditions?: string[];

  // Step 4 Surgeries
  hasSurgeries?: boolean;
  surgeries?: SurgeryItem[];

  // Step 5 Allergies
  hasAllergies?: boolean;
  structuredAllergies?: {
    medication: AllergyItem[];
    food: AllergyItem[];
    environmental: AllergyItem[];
  };
  allergies?: string[];

  // Step 6 Medications
  hasMedications?: boolean;
  medicationsList?: MedicationItem[];
  medications?: string;

  // Step 7 Lifestyle
  activityLevel: string;
  exerciseFrequency?: string;
  sleepHours: number | string;
  sleepQuality?: string;
  dietType?: string;
  dietaryRestrictions?: string[];
  waterIntake: string;
  smoking: string;
  alcohol: string;
  stressLevel?: number;

  // Step 8 Family history
  hasFamilyHistory?: boolean;
  familyHistoryList?: FamilyHistoryItem[];
  familyHistory?: string;

  // Step 9 Women's / Reproductive health
  reproductiveHealth?: ReproductiveHealth;

  // Step 10 Emergency & Goals
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  healthConcerns?: string;
  mainHealthGoal?: string;
  healthGoals: string[];
  
  // Consent
  consentAccepted: boolean;
}

export const profileService = {
  /**
   * Fetch user record directly from database table.
   * Returns null if user is not in the database table (e.g. deleted or empty table).
   */
  async fetchUserProfile(userId: string, email?: string): Promise<UserRecord | null> {
    try {
      let existingUser: any = null;

      // 1. Try finding by ID
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userById) {
        existingUser = userById;
      } else if (email) {
        // 2. Try finding by Email
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (userByEmail) {
          existingUser = userByEmail;
        }
      }

      if (!existingUser) {
        return null;
      }

      // Check health profile for onboarding status
      const { data: healthProfile } = await supabase
        .from('health_profiles')
        .select('isOnboarded, heightCm, weightKg')
        .eq('userId', existingUser.id)
        .maybeSingle();

      const isOnboarded = !!healthProfile?.isOnboarded || 
                          !!existingUser.settings?.isOnboarded || 
                          (Number(healthProfile?.heightCm || 0) > 0 && Number(healthProfile?.weightKg || 0) > 0);

      return {
        id: existingUser.id,
        name: existingUser.name || 'User',
        email: existingUser.email || email || '',
        role: existingUser.role || 'user',
        avatarUrl: existingUser.avatarUrl || '',
        isOnboarded,
      };
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] fetchUserProfile error:', err);
      return null;
    }
  },

  /**
   * Create user profile record in database upon user registration.
   */
  async createUserProfile(supabaseUser: any, name?: string): Promise<UserRecord | null> {
    const userId = supabaseUser.id;
    const email = (supabaseUser.email || '').toLowerCase().trim();
    const finalName = (name || 
                 supabaseUser.user_metadata?.name || 
                 supabaseUser.user_metadata?.full_name || 
                 email.split('@')[0] || 
                 'User').trim();
    const role = supabaseUser.user_metadata?.role || 'user';
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || '';

    try {
      const newRecord = {
        id: userId,
        email,
        name: finalName,
        role,
        avatarUrl,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: insertedUser, error } = await supabase
        .from('users')
        .insert([newRecord])
        .select()
        .maybeSingle();

      if (!error && insertedUser) {
        return {
          id: insertedUser.id,
          name: insertedUser.name || finalName,
          email: insertedUser.email || email,
          role: insertedUser.role || role,
          avatarUrl: insertedUser.avatarUrl || avatarUrl,
          isOnboarded: false,
        };
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[ProfileService] createUserProfile error:', err);
    }
    return null;
  },

  /**
   * Ensure user record exists in database table.
   * If missing during registration, attempts creation.
   * Returns null if user is not in database.
   */
  async ensureUserProfile(supabaseUser: any, _token?: string): Promise<UserRecord | null> {
    const existing = await this.fetchUserProfile(supabaseUser.id, supabaseUser.email);
    if (existing) return existing;
    return this.createUserProfile(supabaseUser);
  },

  /**
   * Get full user profile including health details
   */
  async getUserProfile(userId: string, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.get('/user/profile', { headers });
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        return null;
      }
      if (import.meta.env.DEV) console.warn('[ProfileService] getUserProfile backend fetch failed, falling back to Supabase:', err);
    }

    // Direct Supabase fallback
    try {
      const [userRes, healthRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('health_profiles').select('*').eq('userId', userId).maybeSingle(),
      ]);

      if (!userRes.data) {
        return null;
      }

      const hp = healthRes.data;
      const onboardingData = hp?.settings?.onboardingData || {};
      const isOnboarded = hp?.isOnboarded !== undefined 
        ? Boolean(hp.isOnboarded) 
        : (userRes.data?.settings?.isOnboarded || (Number(hp?.heightCm || 0) > 0));

      return {
        ...userRes.data,
        ...onboardingData,
        healthProfile: hp ? { ...onboardingData, ...hp, isOnboarded } : null,
        isOnboarded,
      };
    } catch (e) {
      if (import.meta.env.DEV) console.error('[ProfileService] getUserProfile error:', e);
      return null;
    }
  },

  /**
   * Save onboarding data
   */
  async saveOnboardingProfile(userId: string, data: OnboardingData, token?: string) {
    try {
      const heightM = data.heightCm / 100;
      const bmi = heightM > 0 ? Number((data.weightKg / (heightM * heightM)).toFixed(1)) : 0;
      
      let bmiCategory = 'Normal';
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
      else if (bmi >= 30) bmiCategory = 'Obese';

      // Send to Backend API
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const payload = {
        ...data,
        bmi,
        bmiCategory,
        isOnboarded: true,
      };

      const response = await apiClient.post('/user/onboarding', payload, { headers });
      if (response.data?.success) {
        return response.data.data;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] API onboarding failed, trying Supabase direct:', err);
    }

    // Direct Supabase fallback
    try {
      const heightM = data.heightCm / 100;
      const bmi = heightM > 0 ? Number((data.weightKg / (heightM * heightM)).toFixed(1)) : 0;
      
      let bmiCategory = 'Normal';
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
      else if (bmi >= 30) bmiCategory = 'Obese';

      const healthProfileRecord = {
        userId,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        age: data.age,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodType: data.bloodGroup || data.bloodType || 'O+',
        bloodGroup: data.bloodGroup || data.bloodType || 'O+',
        location: {
          country: data.country || '',
          state: data.state || '',
          city: data.city || ''
        },
        measurements: data.measurements || {
          bloodPressureSystolic: data.bloodPressureSystolic,
          bloodPressureDiastolic: data.bloodPressureDiastolic,
          restingHeartRate: data.restingHeartRate,
          oxygenSaturation: data.oxygenSaturation,
          bloodGlucose: data.bloodGlucose,
          glucoseType: data.glucoseType,
          bodyTemperature: data.bodyTemperature,
        },
        activityLevel: data.activityLevel,
        lifestyle: {
          activityLevel: data.activityLevel,
          exerciseFrequency: data.exerciseFrequency,
          sleepHours: data.sleepHours,
          sleepQuality: data.sleepQuality,
          dietType: data.dietType,
          waterIntake: data.waterIntake,
          smoking: data.smoking,
          alcohol: data.alcohol,
          stressLevel: data.stressLevel,
        },
        healthGoal: data.mainHealthGoal || (data.healthGoals && data.healthGoals[0]) || 'general_wellness',
        mainHealthGoal: data.mainHealthGoal || 'general_wellness',
        healthGoals: data.healthGoals || ['general_wellness'],
        allergies: data.allergies || [],
        structuredAllergies: data.structuredAllergies || {},
        medicalConditions: data.medicalConditions || [],
        pastConditions: data.pastConditions || [],
        surgeries: data.surgeries || [],
        medicationsList: data.medicationsList || [],
        medications: data.medications || '',
        familyHistoryList: data.familyHistoryList || [],
        familyHistory: data.familyHistory || '',
        reproductiveHealth: data.reproductiveHealth || null,
        emergencyContact: data.emergencyContact,
        healthConcerns: data.healthConcerns || '',
        bmi,
        bmiCategory,
        isOnboarded: true,
        completionPercentage: 100,
        consentAccepted: true,
        consentTimestamp: new Date().toISOString(),
        settings: {
          smoking: data.smoking,
          alcohol: data.alcohol,
          sleepHours: data.sleepHours,
          waterIntake: data.waterIntake,
          medications: data.medications,
          dietType: data.dietType,
          language: data.language,
          emergencyContact: data.emergencyContact,
        },
        updatedAt: new Date().toISOString(),
      };

      const supabasePayload = {
        userId,
        heightCm: data.heightCm,
        height: data.heightCm,
        weightKg: data.weightKg,
        weight: data.weightKg,
        age: data.age,
        gender: data.gender,
        bloodType: data.bloodGroup || data.bloodType || 'O+',
        activityLevel: data.activityLevel || 'moderately_active',
        healthGoal: data.mainHealthGoal || (data.healthGoals && data.healthGoals[0]) || 'stay_healthy',
        healthGoals: data.healthGoals || ['stay_healthy'],
        allergies: data.allergies || [],
        dietaryRestrictions: [data.dietType].filter(Boolean),
        medicalConditions: (data.medicalConditions || []).map((m: any) => typeof m === 'string' ? m : m.name),
        isOnboarded: true,
        bmi,
        bmiCategory,
        settings: {
          ...healthProfileRecord.settings,
          language: data.language,
          dietType: data.dietType,
          onboardingData: healthProfileRecord
        },
        updatedAt: new Date().toISOString()
      };

      await Promise.all([
        supabase.from('health_profiles').upsert([supabasePayload]),
        supabase.from('users').update({ 
          name: data.name,
          settings: {
            language: data.language,
            isOnboarded: true
          }
        }).eq('id', userId),
      ]);

      return {
        user: { id: userId, name: data.name, isOnboarded: true },
        healthProfile: { ...healthProfileRecord, isOnboarded: true },
        isOnboarded: true,
      };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[ProfileService] saveOnboardingProfile error:', err);
      throw new Error(err.message || 'Failed to save health profile.');
    }
  },

  /**
   * Update basic profile info (name, avatar, settings)
   */
  async updateProfile(userId: string, updates: Partial<UserRecord>, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.put('/user/profile', updates, { headers });
      if (res.data?.success) {
        return res.data.data;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] updateProfile API error, attempting Supabase direct:', err);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.avatarUrl ? { avatarUrl: updates.avatarUrl } : {}),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e: any) {
      if (import.meta.env.DEV) console.error('[ProfileService] updateProfile exception:', e);
      throw new Error(e.message || 'Failed to update profile');
    }
  },

  /**
   * Save partial onboarding draft (Save & Resume)
   */
  async saveOnboardingDraft(_userId: string, draftData: any, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.post('/user/onboarding/draft', draftData, { headers });
      if (res.data?.success) {
        return res.data.data;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] saveOnboardingDraft API error:', err);
    }
    return null;
  },

  /**
   * Get partial onboarding draft (Save & Resume)
   */
  async getOnboardingDraft(_userId: string, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.get('/user/onboarding/draft', { headers });
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] getOnboardingDraft API error:', err);
    }
    return null;
  },
};

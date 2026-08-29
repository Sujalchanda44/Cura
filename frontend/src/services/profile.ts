import { supabase } from '@/api/supabase';
import { apiClient } from '@/api/apiClient';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
}

export interface OnboardingData {
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  sleepHours: number | string;
  waterIntake: string;
  smoking: string;
  alcohol: string;
  allergies: string[];
  medicalConditions: string[];
  bloodType: string;
  medications?: string;
  familyHistory?: string;
  healthGoals: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

export const profileService = {
  /**
   * Ensure user record exists in database table.
   * If missing, creates the user record immediately so no authenticated user is ever without a profile.
   */
  async ensureUserProfile(supabaseUser: any, token?: string): Promise<UserRecord> {
    const userId = supabaseUser.id;
    const email = supabaseUser.email || '';
    const name = supabaseUser.user_metadata?.name || 
                 supabaseUser.user_metadata?.full_name || 
                 email.split('@')[0] || 
                 'User';
    const role = supabaseUser.user_metadata?.role || 'user';
    const avatarUrl = supabaseUser.user_metadata?.avatar_url || '';

    // First try checking Supabase `users` table directly
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingUser) {
        // Check health profile for onboarding status
        const { data: healthProfile } = await supabase
          .from('health_profiles')
          .select('isOnboarded')
          .eq('userId', userId)
          .maybeSingle();

        return {
          id: existingUser.id,
          name: existingUser.name || name,
          email: existingUser.email || email,
          role: existingUser.role || role,
          avatarUrl: existingUser.avatarUrl || avatarUrl,
          isOnboarded: !!healthProfile?.isOnboarded,
        };
      }

      // User record does not exist in table -> Insert it now
      const newRecord = {
        id: userId,
        email,
        name,
        role,
        avatarUrl,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert([newRecord])
        .select()
        .single();

      if (!insertError && insertedUser) {
        return {
          id: insertedUser.id,
          name: insertedUser.name,
          email: insertedUser.email,
          role: insertedUser.role,
          avatarUrl: insertedUser.avatarUrl,
          isOnboarded: false,
        };
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] Supabase direct check fallback:', err);
    }

    // Fallback: Verify or create via Backend REST API
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await apiClient.get('/user/profile', { headers });
      if (res.data?.success && res.data?.data) {
        const u = res.data.data;
        return {
          id: u.id || userId,
          name: u.name || name,
          email: u.email || email,
          role: u.role || role,
          avatarUrl: u.avatarUrl || avatarUrl,
          isOnboarded: !!u.isOnboarded,
        };
      }
    } catch (apiErr) {
      if (import.meta.env.DEV) console.warn('[ProfileService] API profile fallback:', apiErr);
    }

    // Default safe fallback
    return {
      id: userId,
      name,
      email,
      role,
      avatarUrl,
      isOnboarded: false,
    };
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
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ProfileService] getUserProfile backend fetch failed, falling back to Supabase:', err);
    }

    // Direct Supabase fallback
    try {
      const [userRes, healthRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('health_profiles').select('*').eq('userId', userId).maybeSingle(),
      ]);

      return {
        ...(userRes.data || { id: userId }),
        healthProfile: healthRes.data || null,
        isOnboarded: !!healthRes.data?.isOnboarded,
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
        gender: data.gender,
        bloodType: data.bloodType,
        activityLevel: data.activityLevel,
        healthGoal: data.healthGoals[0] || 'maintain_weight',
        healthGoals: data.healthGoals,
        allergies: data.allergies,
        medicalConditions: data.medicalConditions,
        bmi,
        bmiCategory,
        isOnboarded: true,
        settings: {
          smoking: data.smoking,
          alcohol: data.alcohol,
          sleepHours: data.sleepHours,
          waterIntake: data.waterIntake,
          medications: data.medications,
          emergencyContact: data.emergencyContact,
        },
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        supabase.from('health_profiles').upsert([healthProfileRecord]),
        supabase.from('users').update({ name: data.name }).eq('id', userId),
      ]);

      return {
        user: { id: userId, name: data.name },
        healthProfile: healthProfileRecord,
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
};

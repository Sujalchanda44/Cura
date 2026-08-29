import { apiClient } from '@/api/apiClient';
import { supabase } from '@/api/supabase';

export interface DailyMetricPayload {
  steps?: number;
  waterMl?: number;
  sleepHours?: number;
  activeCaloriesBurnt?: number;
  exerciseDuration?: number;
  heartRateAvg?: number;
  date?: string;
}

export const healthService = {
  /**
   * Get aggregated dashboard health metrics & trend charts
   */
  async getDashboard(date?: string) {
    try {
      const response = await apiClient.get('/health/dashboard', {
        params: date ? { date } : undefined,
      });
      return response.data?.data;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[HealthService] API getDashboard error, falling back to direct Supabase:', err);
    }

    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const [metricRes, profileRes] = await Promise.all([
        supabase.from('health_metrics').select('*').eq('userId', session.user.id).eq('date', today).maybeSingle(),
        supabase.from('health_profiles').select('*').eq('userId', session.user.id).maybeSingle(),
      ]);

      const metric = metricRes.data || { steps: 0, waterMl: 0, sleepHours: 0, activeCaloriesBurnt: 0, workoutMinutes: 0 };
      const profile = profileRes.data || null;

      return {
        date: today,
        healthScore: {
          score: metric.steps > 0 || metric.waterMl > 0 ? 80 : null,
          status: 'Good',
        },
        metrics: {
          waterIntake: { current: metric.waterMl || 0, target: profile?.targets?.waterMl || 2500, unit: 'ml' },
          sleep: { current: metric.sleepHours || 0, target: 8, unit: 'hours' },
          caloriesBurned: { current: metric.activeCaloriesBurnt || 0, unit: 'kcal' },
          exerciseDuration: { current: metric.workoutMinutes || metric.exerciseDuration || 0, unit: 'minutes' },
          steps: { current: metric.steps || 0, target: profile?.targets?.steps || 8000, unit: 'steps' },
        },
        chartHistory: [],
      };
    } catch (e) {
      if (import.meta.env.DEV) console.error('[HealthService] getDashboard fallback failed:', e);
      return null;
    }
  },

  /**
   * Log daily health metrics
   */
  async logDaily(payload: DailyMetricPayload) {
    try {
      const response = await apiClient.post('/health/daily-log', payload);
      return response.data?.data;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[HealthService] API logDaily error, falling back to Supabase:', err);
    }

    try {
      const today = payload.date || new Date().toISOString().split('T')[0];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const record = {
        userId: session.user.id,
        date: today,
        steps: payload.steps || 0,
        waterMl: payload.waterMl || 0,
        sleepHours: payload.sleepHours || 0,
        activeCaloriesBurnt: payload.activeCaloriesBurnt || 0,
        workoutMinutes: payload.exerciseDuration || 0,
      };

      const { data, error } = await supabase.from('health_metrics').upsert([record]).select().single();
      if (error) throw error;
      return data;
    } catch (e: any) {
      if (import.meta.env.DEV) console.error('[HealthService] logDaily exception:', e);
      throw e;
    }
  },

  /**
   * Get active reminders
   */
  async getNotifications() {
    try {
      const response = await apiClient.get('/notifications');
      return response.data?.data || [];
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[HealthService] getNotifications fallback:', err);
      return [];
    }
  },

  /**
   * Toggle medication reminder state
   */
  async toggleReminder(id: string) {
    try {
      const response = await apiClient.patch(`/notifications/${id}/toggle`);
      return response.data?.data;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[HealthService] toggleReminder error:', err);
      return null;
    }
  },
};

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { profileService, UserRecord } from '@/services/profile';

export function useProfile() {
  const { user, session, updateUser: updateAuthUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfileData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getUserProfile(user.id, session?.access_token);
      setProfileData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      if (import.meta.env.DEV) console.error('[useProfile] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserRecord>) => {
    if (!user) return;
    try {
      await updateAuthUser(updates);
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  return {
    user,
    profileData,
    healthProfile: profileData?.healthProfile || null,
    isLoading,
    error,
    refresh: fetchProfile,
    updateProfile,
  };
}

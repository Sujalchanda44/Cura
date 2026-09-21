import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/api/supabase';
import { authService, SignUpParams, SignInParams } from '@/services/auth';
import { profileService, UserRecord, OnboardingData } from '@/services/profile';

export interface AuthContextType {
  user: UserRecord | null;
  healthProfile: any | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (credentials: SignInParams) => Promise<boolean>;
  register: (params: SignUpParams) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  updateUser: (updates: Partial<UserRecord>) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(() => {
    try {
      const saved = localStorage.getItem('cura_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [healthProfile, setHealthProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Sync user profile and health profile for an authenticated session
   */
  const syncProfile = useCallback(async (currentSession: Session | null, showLoading = false) => {
    if (!currentSession || !currentSession.user) {
      return;
    }

    if (showLoading) {
      setIsProfileLoading(true);
    }
    try {
      const userRec = await profileService.ensureUserProfile(
        currentSession.user,
        currentSession.access_token
      );
      if (userRec) {
        setUser(userRec);
        localStorage.setItem('cura_auth_user', JSON.stringify(userRec));
      }

      const fullData = await profileService.getUserProfile(
        currentSession.user.id,
        currentSession.access_token
      );
      if (fullData) {
        setHealthProfile(fullData.healthProfile || null);
        setUser(prev => {
          const updated = prev ? { ...prev, isOnboarded: !!fullData.isOnboarded } : null;
          if (updated) {
            localStorage.setItem('cura_auth_user', JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AuthProvider] Profile sync error:', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  /**
   * Initial session loading and auth state change subscription
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const initialSession = await authService.getSession();
        if (isMounted) {
          setSession(initialSession);
          if (initialSession) {
            await syncProfile(initialSession, false);
          }
          setIsAuthLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[AuthProvider] Init error:', err);
        if (isMounted) setIsAuthLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          // Confirm whether the session was legitimately destroyed or if this was a transient lock event on tab switch
          const currentStoredSession = await authService.getSession();
          if (!currentStoredSession) {
            setSession(null);
            setUser(null);
            setHealthProfile(null);
            setIsAuthLoading(false);
            setIsProfileLoading(false);
            localStorage.removeItem('cura_auth_user');
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          if (newSession) {
            setSession(newSession);
          }
          return;
        }

        if (event === 'SIGNED_IN') {
          if (newSession) {
            setSession(newSession);
            setIsAuthLoading(false);
            setUser(prev => {
              if (!prev) {
                syncProfile(newSession, false);
              }
              return prev;
            });
          }
          return;
        }

        if (event === 'USER_UPDATED') {
          if (newSession) {
            setSession(newSession);
            await syncProfile(newSession, false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  /**
   * Login user
   */
  const login = async (credentials: SignInParams): Promise<boolean> => {
    setIsAuthLoading(true);
    setError(null);
    try {
      const { user: authUser, session: newSession, error: authError } = await authService.signIn(credentials);

      if (authError) {
        setError(authError);
        setIsAuthLoading(false);
        return false;
      }

      if (newSession && authUser) {
        setSession(newSession);
        setIsAuthLoading(false);
        await syncProfile(newSession);
        return true;
      }

      setError('Session could not be established.');
      setIsAuthLoading(false);
      return false;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setIsAuthLoading(false);
      return false;
    }
  };

  /**
   * Register user
   */
  const register = async (params: SignUpParams): Promise<boolean> => {
    setIsAuthLoading(true);
    setError(null);
    try {
      const { user: authUser, session: newSession, error: authError } = await authService.signUp(params);

      if (authError) {
        setError(authError);
        setIsAuthLoading(false);
        return false;
      }

      if (authUser) {
        // Automatically ensure user profile is inserted
        await profileService.ensureUserProfile(authUser, newSession?.access_token);

        if (newSession) {
          setSession(newSession);
          setIsAuthLoading(false);
          await syncProfile(newSession);
          return true;
        } else {
          // Email confirmation required or auto-signed up
          setIsAuthLoading(false);
          return true;
        }
      }

      setIsAuthLoading(false);
      return false;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsAuthLoading(false);
      return false;
    }
  };

  /**
   * Sign in with Google
   */
  const loginWithGoogle = async () => {
    setIsAuthLoading(true);
    setError(null);
    const { error: googleError } = await authService.signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setIsAuthLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setIsAuthLoading(true);
    try {
      await authService.signOut();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Logout error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setHealthProfile(null);
      setIsAuthLoading(false);
      setIsProfileLoading(false);
      setError(null);
      localStorage.removeItem('cura_auth_user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  /**
   * Forgot password request
   */
  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setError(null);
    const { error: reqError } = await authService.resetPasswordForEmail(email);
    setIsAuthLoading(false);
    if (reqError) {
      setError(reqError);
      return false;
    }
    return true;
  };

  /**
   * Reset / Update password
   */
  const resetPassword = async (password: string): Promise<boolean> => {
    setIsAuthLoading(true);
    setError(null);
    const { error: updError } = await authService.updatePassword(password);
    setIsAuthLoading(false);
    if (updError) {
      setError(updError);
      return false;
    }
    return true;
  };

  /**
   * Complete onboarding
   */
  const completeOnboarding = async (data: OnboardingData): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to save onboarding details.');
      return false;
    }

    setIsProfileLoading(true);
    setError(null);
    try {
      const result = await profileService.saveOnboardingProfile(
        user.id,
        data,
        session?.access_token
      );
      if (result) {
        setUser(prev => prev ? { ...prev, name: data.name, isOnboarded: true } : null);
        setHealthProfile(result.healthProfile);
        return true;
      }
      setError('Failed to complete onboarding. Please verify your inputs.');
      return false;
    } catch (err: any) {
      setError(err.message || 'Error completing onboarding.');
      return false;
    } finally {
      setIsProfileLoading(false);
    }
  };

  /**
   * Update profile details
   */
  const updateUser = async (updates: Partial<UserRecord>) => {
    if (!user) return;
    try {
      const updated = await profileService.updateProfile(user.id, updates, session?.access_token);
      if (updated) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthProvider] updateUser error:', err);
      throw err;
    }
  };

  /**
   * Manually trigger a fresh profile reload
   */
  const refreshProfile = async () => {
    if (session) {
      await syncProfile(session);
    }
  };

  const value: AuthContextType = {
    user,
    healthProfile,
    session,
    isAuthenticated: !!user,
    isAuthLoading,
    isProfileLoading,
    isLoading: isAuthLoading || isProfileLoading,
    error,
    clearError,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    completeOnboarding,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

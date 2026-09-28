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
  const [user, setUser] = useState<UserRecord | null>(null);
  const [healthProfile, setHealthProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Sync user profile and health profile for an authenticated session.
   * Returns false if the user record does not exist in the database (e.g. table wiped or user deleted).
   */
  const syncProfile = useCallback(async (currentSession: Session | null, showLoading = false): Promise<boolean> => {
    if (!currentSession || !currentSession.user) {
      return false;
    }

    if (showLoading) {
      setIsProfileLoading(true);
    }
    try {
      // 1. Verify user exists in the database users table
      const userRec = await profileService.fetchUserProfile(
        currentSession.user.id,
        currentSession.user.email
      );

      // If user does not exist in the database table (e.g. table cleared or user deleted)
      if (!userRec) {
        return false;
      }

      // Check if localStorage already marked this user as onboarded
      const localUserStr = localStorage.getItem('cura_auth_user');
      let localIsOnboarded = false;
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed && parsed.id === userRec.id && parsed.isOnboarded) {
            localIsOnboarded = true;
          }
        } catch (_) {}
      }

      const initialUser = {
        ...userRec,
        isOnboarded: userRec.isOnboarded || localIsOnboarded,
      };

      setUser(initialUser);
      localStorage.setItem('cura_auth_user', JSON.stringify(initialUser));

      const fullData = await profileService.getUserProfile(
        currentSession.user.id,
        currentSession.access_token
      );
      if (fullData) {
        setHealthProfile(fullData.healthProfile || null);
        setUser(prev => {
          const resolvedOnboarded = !!fullData.isOnboarded || 
                                   !!fullData.healthProfile?.isOnboarded || 
                                   (Number(fullData.healthProfile?.heightCm || 0) > 0) ||
                                   (prev?.isOnboarded ?? false) || 
                                   localIsOnboarded;
          const updated = prev ? { ...prev, isOnboarded: resolvedOnboarded } : null;
          if (updated) {
            localStorage.setItem('cura_auth_user', JSON.stringify(updated));
          }
          return updated;
        });
      }
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AuthProvider] Profile sync error:', err);
      return false;
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
        if (!initialSession || !initialSession.user) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setHealthProfile(null);
            localStorage.removeItem('cura_auth_user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthLoading(false);
          }
          return;
        }

        // Validate session with Supabase auth service
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          await authService.signOut();
          if (isMounted) {
            setSession(null);
            setUser(null);
            setHealthProfile(null);
            localStorage.removeItem('cura_auth_user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthLoading(false);
          }
          return;
        }

        if (isMounted) {
          // Check if user actually exists in application database (users table)
          const profileExists = await syncProfile(initialSession, false);
          if (profileExists) {
            setSession(initialSession);
          } else {
            // User does NOT exist in the database table! Clear auth & sign out!
            await authService.signOut();
            setSession(null);
            setUser(null);
            setHealthProfile(null);
            localStorage.removeItem('cura_auth_user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          setIsAuthLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[AuthProvider] Init error:', err);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setHealthProfile(null);
          localStorage.removeItem('cura_auth_user');
          setIsAuthLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setHealthProfile(null);
          setIsAuthLoading(false);
          setIsProfileLoading(false);
          localStorage.removeItem('cura_auth_user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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
            const profileExists = await syncProfile(newSession, false);
            if (profileExists) {
              setSession(newSession);
              setIsAuthLoading(false);
            } else {
              await authService.signOut();
              setSession(null);
              setUser(null);
              setHealthProfile(null);
              localStorage.removeItem('cura_auth_user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setIsAuthLoading(false);
            }
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
        const profileExists = await syncProfile(newSession);
        if (!profileExists) {
          await authService.signOut();
          setSession(null);
          setUser(null);
          localStorage.removeItem('cura_auth_user');
          setError('User account was not found in the database. Please register.');
          setIsAuthLoading(false);
          return false;
        }
        setSession(newSession);
        setIsAuthLoading(false);
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
      // 1. Clear any prior local storage and state before registering a fresh account
      localStorage.removeItem('cura_auth_user');
      setUser(null);
      setHealthProfile(null);

      const { user: authUser, session: newSession, error: authError } = await authService.signUp(params);

      if (authError) {
        setError(authError);
        setIsAuthLoading(false);
        return false;
      }

      if (authUser) {
        // Automatically ensure user profile is inserted in DB
        const createdUser = await profileService.createUserProfile(authUser, params.name);

        // A freshly registered user MUST ALWAYS start onboarding
        const freshUser: UserRecord = createdUser || {
          id: authUser.id,
          name: params.name,
          email: params.email,
          role: 'user',
          isOnboarded: false,  // NEW user — always false
        };

        if (newSession) {
          setSession(newSession);
          setUser(freshUser);
          setHealthProfile(null);
          localStorage.setItem('cura_auth_user', JSON.stringify(freshUser));
          setIsAuthLoading(false);
          return true;
        } else {
          // Attempt automatic sign-in
          const { session: directSession } = await authService.signIn({ email: params.email, password: params.password });
          if (directSession) {
            setSession(directSession);
            setUser(freshUser);
            setHealthProfile(null);
            localStorage.setItem('cura_auth_user', JSON.stringify(freshUser));
            setIsAuthLoading(false);
            return true;
          }

          // In local dev/unconfirmed mode, create active session record for onboarding
          setUser(freshUser);
          setHealthProfile(null);
          localStorage.setItem('cura_auth_user', JSON.stringify(freshUser));
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
        const updatedUser: UserRecord = {
          ...user,
          name: data.name || user.name,
          isOnboarded: true,
        };
        setUser(updatedUser);
        localStorage.setItem('cura_auth_user', JSON.stringify(updatedUser));
        setHealthProfile(result.healthProfile || result);
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
      const merged = { ...user, ...updates, ...(updated || {}) };
      setUser(merged);
      localStorage.setItem('cura_auth_user', JSON.stringify(merged));
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthProvider] updateUser error:', err);
      const merged = { ...user, ...updates };
      setUser(merged);
      localStorage.setItem('cura_auth_user', JSON.stringify(merged));
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
    isAuthenticated: !isAuthLoading && !!session && !!user,
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

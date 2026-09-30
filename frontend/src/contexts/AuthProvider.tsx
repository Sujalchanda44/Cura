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

// Quick helper to check if any active auth tokens exist in localStorage
const hasStoredAuthToken = (): boolean => {
  try {
    const cachedUser = localStorage.getItem('cura_auth_user');
    const cachedToken = localStorage.getItem('accessToken');
    if (cachedUser || cachedToken) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const val = localStorage.getItem(key);
        if (val && val !== 'null' && val !== 'undefined') return true;
      }
    }
  } catch (_) {}
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [healthProfile, setHealthProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() => hasStoredAuthToken());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegisteringRef = React.useRef(false);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Sync user profile and health profile for an authenticated session.
   */
  const syncProfile = useCallback(async (currentSession: Session | null, showLoading = false): Promise<boolean> => {
    if (!currentSession || !currentSession.user) {
      setUser(null);
      setHealthProfile(null);
      localStorage.removeItem('cura_auth_user');
      return false;
    }

    if (showLoading) {
      setIsProfileLoading(true);
    }
    try {
      // 1. Check if localStorage already has valid user data matching THIS session user
      const localUserStr = localStorage.getItem('cura_auth_user');
      let cachedUser: UserRecord | null = null;
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed && parsed.id === currentSession.user.id) {
            cachedUser = parsed;
            setUser(parsed);
          } else {
            // Stale cache from different user or ghost account - remove immediately
            localStorage.removeItem('cura_auth_user');
          }
        } catch (_) {
          localStorage.removeItem('cura_auth_user');
        }
      }

      // 2. Fetch full profile with a 3.5s timeout to prevent cold-start backend delays
      const profilePromise = profileService.getUserProfile(
        currentSession.user.id,
        currentSession.access_token
      );
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));

      const fullData = await Promise.race([profilePromise, timeoutPromise]);

      if (fullData) {
        const resolvedOnboarded = !!fullData.isOnboarded || 
                                 !!fullData.healthProfile?.isOnboarded || 
                                 (Number(fullData.healthProfile?.heightCm || 0) > 0) ||
                                 (cachedUser?.isOnboarded ?? false);

        const updatedUser: UserRecord = {
          id: fullData.id || currentSession.user.id,
          name: fullData.name || cachedUser?.name || currentSession.user.user_metadata?.name || 'User',
          email: fullData.email || cachedUser?.email || currentSession.user.email || '',
          role: fullData.role || cachedUser?.role || 'user',
          avatarUrl: fullData.avatarUrl || cachedUser?.avatarUrl || '',
          isOnboarded: resolvedOnboarded,
        };

        setUser(updatedUser);
        setHealthProfile(fullData.healthProfile || null);
        localStorage.setItem('cura_auth_user', JSON.stringify(updatedUser));
        return true;
      }

      // If backend was slow or user is cached
      if (cachedUser) {
        return true;
      }

      // 3. Fallback: verify user in Supabase users table
      const userRec = await profileService.fetchUserProfile(
        currentSession.user.id,
        currentSession.user.email
      );

      if (userRec) {
        setUser(userRec);
        localStorage.setItem('cura_auth_user', JSON.stringify(userRec));
        return true;
      }

      // If not yet in table, ensure user record
      const ensured = await profileService.ensureUserProfile(currentSession.user);
      if (ensured) {
        setUser(ensured);
        localStorage.setItem('cura_auth_user', JSON.stringify(ensured));
        return true;
      }

      return false;
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
        // If there are no stored credentials anywhere in localStorage, instantly complete
        if (!hasStoredAuthToken()) {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setHealthProfile(null);
            setIsAuthLoading(false);
          }
          return;
        }

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

        if (isMounted) {
          setSession(initialSession);
          if (initialSession.access_token) {
            localStorage.setItem('accessToken', initialSession.access_token);
          }
          await syncProfile(initialSession, false);
          setIsAuthLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[AuthProvider] Init error:', err);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // Skip background handlers while manual registration is finalizing
        if (isRegisteringRef.current) {
          if (newSession) setSession(newSession);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setHealthProfile(null);
          setIsAuthLoading(false);
          setIsProfileLoading(false);
          setIsSubmitting(false);
          localStorage.removeItem('cura_auth_user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          if (newSession) {
            setSession(newSession);
            if (newSession.access_token) {
              localStorage.setItem('accessToken', newSession.access_token);
            }
          }
          return;
        }

        if (event === 'SIGNED_IN') {
          if (newSession) {
            setSession(newSession);
            if (newSession.access_token) {
              localStorage.setItem('accessToken', newSession.access_token);
            }
            await syncProfile(newSession, false);
            setIsAuthLoading(false);
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
    setIsSubmitting(true);
    setError(null);
    try {
      const { user: authUser, session: newSession, error: authError } = await authService.signIn(credentials);

      if (authError) {
        setError(authError);
        setIsSubmitting(false);
        return false;
      }

      if (newSession && authUser) {
        setSession(newSession);
        if (newSession.access_token) {
          localStorage.setItem('accessToken', newSession.access_token);
        }

        const profileExists = await syncProfile(newSession);
        if (!profileExists) {
          // If no row in users table yet, ensure profile instead of signing out
          const ensured = await profileService.ensureUserProfile(authUser);
          if (ensured) {
            setUser(ensured);
            localStorage.setItem('cura_auth_user', JSON.stringify(ensured));
          } else {
            await authService.signOut();
            setSession(null);
            setUser(null);
            localStorage.removeItem('cura_auth_user');
            setError('User account was not found in the database. Please register.');
            setIsSubmitting(false);
            return false;
          }
        }
        setIsSubmitting(false);
        return true;
      }

      setError('Session could not be established.');
      setIsSubmitting(false);
      return false;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setIsSubmitting(false);
      return false;
    }
  };

  /**
   * Fast register user - no blocking route spinner
   */
  const register = async (params: SignUpParams): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    isRegisteringRef.current = true;
    try {
      localStorage.removeItem('cura_auth_user');
      setUser(null);
      setHealthProfile(null);

      const { user: authUser, session: newSession, error: authError } = await authService.signUp(params);

      if (authError) {
        setError(authError);
        setIsSubmitting(false);
        isRegisteringRef.current = false;
        return false;
      }

      if (authUser) {
        // Ensure user record is created in public.users table in Supabase
        const dbUser = await profileService.ensureUserProfile(authUser);

        const freshUser: UserRecord = {
          id: authUser.id,
          name: dbUser?.name || params.name.trim(),
          email: dbUser?.email || params.email.toLowerCase().trim(),
          role: dbUser?.role || 'user',
          isOnboarded: false,
          isNewRegistration: true,
        };

        setUser(freshUser);
        localStorage.setItem('cura_auth_user', JSON.stringify(freshUser));

        let activeSession = newSession;
        if (!activeSession) {
          // Auto sign-in if no session returned from signUp
          const { session: directSession } = await authService.signIn({
            email: params.email,
            password: params.password,
          });
          if (directSession) {
            activeSession = directSession;
          }
        }

        if (activeSession) {
          setSession(activeSession);
          if (activeSession.access_token) {
            localStorage.setItem('accessToken', activeSession.access_token);
          }
        }

        setIsSubmitting(false);
        // Retain registration lock briefly to let route transition complete smoothly
        setTimeout(() => {
          isRegisteringRef.current = false;
        }, 2000);
        return true;
      }

      setIsSubmitting(false);
      isRegisteringRef.current = false;
      return false;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsSubmitting(false);
      isRegisteringRef.current = false;
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
    isLoading: isSubmitting || isAuthLoading || isProfileLoading,
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

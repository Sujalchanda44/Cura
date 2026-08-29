import { supabase } from '@/api/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SupabaseUser | null;
  session: Session | null;
  error: string | null;
}

/**
 * Format raw error messages into clean, user-friendly messages
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  if (typeof error === 'string') return error;

  const message = error.message || error.error_description || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credential') || lower.includes('invalid grant')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('unique constraint')) {
    return 'An account with this email address already exists. Please log in instead.';
  }

  if (lower.includes('password should be at least') || lower.includes('weak password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  if (lower.includes('signup requires a valid password') || lower.includes('missing password')) {
    return 'Please provide a valid password.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('connection refused') || lower.includes('enotfound')) {
    return 'Unable to reach the authentication server. Please check your internet connection.';
  }

  if (lower.includes('jwt') || lower.includes('token expired') || lower.includes('session expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  return message || 'Authentication failed. Please try again.';
}

export const authService = {
  /**
   * Register new user with Supabase Auth
   */
  async signUp({ name, email, password }: SignUpParams): Promise<AuthResult> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanName = name.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName,
            role: 'user',
          },
        },
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] SignUp error:', error);
        return { user: null, session: null, error: formatAuthError(error) };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] SignUp exception:', err);
      return { user: null, session: null, error: formatAuthError(err) };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInParams): Promise<AuthResult> {
    try {
      const cleanEmail = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] SignIn error:', error);
        return { user: null, session: null, error: formatAuthError(error) };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] SignIn exception:', err);
      return { user: null, session: null, error: formatAuthError(err) };
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] Google OAuth error:', error);
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] Google OAuth exception:', err);
      return { error: formatAuthError(err) };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] SignOut error:', error);
        return { error: formatAuthError(error) };
      }
      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] SignOut exception:', err);
      return { error: formatAuthError(err) };
    }
  },

  /**
   * Request password reset email
   */
  async resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth?tab=reset`,
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] Reset password error:', error);
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] Reset password exception:', err);
      return { error: formatAuthError(err) };
    }
  },

  /**
   * Update current user's password
   */
  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (import.meta.env.DEV) console.error('[AuthService] Update password error:', error);
        return { error: formatAuthError(error) };
      }
      return { error: null };
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[AuthService] Update password exception:', err);
      return { error: formatAuthError(err) };
    }
  },

  /**
   * Get active session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AuthService] getSession error:', err);
      return null;
    }
  },

  /**
   * Get current auth user
   */
  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[AuthService] getCurrentUser error:', err);
      return null;
    }
  },
};

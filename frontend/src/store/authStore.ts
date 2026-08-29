import { create } from 'zustand';
import { authService, formatAuthError } from '@/services/auth';
import { profileService, UserRecord } from '@/services/profile';

interface AuthState {
  user: UserRecord | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (userData: { email: string; password: string; name: string }) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUser: (userData: Partial<UserRecord>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { user: authUser, session, error } = await authService.signIn({ email, password });

      if (error || !session || !authUser) {
        set({ error: error || 'Login failed', isLoading: false });
        return false;
      }

      const userRec = await profileService.ensureUserProfile(authUser, session.access_token);
      const fullData = await profileService.getUserProfile(authUser.id, session.access_token);
      
      const mappedUser: UserRecord = {
        ...userRec,
        isOnboarded: !!fullData?.isOnboarded,
      };

      set({
        user: mappedUser,
        sessionToken: session.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: formatAuthError(err), isLoading: false });
      return false;
    }
  },

  register: async ({ email, password, name }) => {
    set({ isLoading: true, error: null });
    try {
      const { user: authUser, session, error } = await authService.signUp({ email, password, name });

      if (error) {
        set({ error, isLoading: false });
        return false;
      }

      if (authUser) {
        const userRec = await profileService.ensureUserProfile(authUser, session?.access_token);
        
        if (session) {
          set({
            user: { ...userRec, isOnboarded: false },
            sessionToken: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: formatAuthError(err), isLoading: false });
      return false;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    const { error } = await authService.signInWithGoogle();
    if (error) {
      set({ error, isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    const { error } = await authService.resetPasswordForEmail(email);
    set({ isLoading: false });
    if (error) {
      set({ error });
      return false;
    }
    return true;
  },

  resetPassword: async (password) => {
    set({ isLoading: true, error: null });
    const { error } = await authService.updatePassword(password);
    set({ isLoading: false });
    if (error) {
      set({ error });
      return false;
    }
    return true;
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Logout error:', err);
    } finally {
      set({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadSession: async () => {
    try {
      const session = await authService.getSession();
      if (session && session.user) {
        const userRec = await profileService.ensureUserProfile(session.user, session.access_token);
        const fullData = await profileService.getUserProfile(session.user.id, session.access_token);

        set({
          user: { ...userRec, isOnboarded: !!fullData?.isOnboarded },
          sessionToken: session.access_token,
          isAuthenticated: true,
        });
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('Error loading session:', e);
    }
  },

  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...userData };
      return { user: updated };
    });
  },
}));

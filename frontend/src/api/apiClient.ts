import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Try get token directly from existing header or Supabase session
    if (!config.headers.Authorization) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        } else {
          const fallbackToken = localStorage.getItem('accessToken');
          if (fallbackToken) {
            config.headers.Authorization = `Bearer ${fallbackToken}`;
          }
        }
      } catch {
        const fallbackToken = localStorage.getItem('accessToken');
        if (fallbackToken) {
          config.headers.Authorization = `Bearer ${fallbackToken}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 1. Try Supabase refresh first
        const { data: refreshData, error: sbError } = await supabase.auth.refreshSession();
        if (!sbError && refreshData?.session?.access_token) {
          const newAccessToken = refreshData.session.access_token;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }

        // 2. Fallback to local refresh token if using local backend auth
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          if (response.data?.success && response.data?.data?.tokens) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        if (import.meta.env.DEV) console.warn('Token refresh could not be completed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

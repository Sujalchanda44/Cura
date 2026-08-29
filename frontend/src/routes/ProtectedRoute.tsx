import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthLoading, isProfileLoading, user } = useAuth();

  // App startup & verification loading state
  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide">
          Verifying session & clinical credentials...
        </p>
      </div>
    );
  }

  // Not logged in -> Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Logged in but has not completed onboarding -> Redirect to Onboarding
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

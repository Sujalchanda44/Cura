import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingRouteProps {
  children?: React.ReactNode;
}

export const OnboardingRoute: React.FC<OnboardingRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthLoading, isProfileLoading, user } = useAuth();

  if (isAuthLoading || (!user && isProfileLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide">
          Verifying profile status...
        </p>
      </div>
    );
  }

  // If unauthenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // If already completed onboarding -> take user straight to dashboard
  if (user && user.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface GuestRouteProps {
  children?: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthLoading, isProfileLoading, user } = useAuth();

  if (isAuthLoading || (!user && isProfileLoading && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide">
          Verifying session status...
        </p>
      </div>
    );
  }

  // If already authenticated -> automatically redirect to dashboard or onboarding
  if (isAuthenticated && user) {
    return <Navigate to={user.isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

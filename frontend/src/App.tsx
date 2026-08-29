import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { OnboardingRoute } from '@/routes/OnboardingRoute';

import { Landing } from '@/pages/Landing';
import { Auth } from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Scanner from '@/pages/Scanner';
import ProductAnalysis from '@/pages/ProductAnalysis';
import Recommendations from '@/pages/Recommendations';
import AIAssistant from '@/pages/AIAssistant';

function AppRoutes() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Guest Auth Pages */}
        <Route 
          path="/auth/login" 
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          } 
        />
        <Route 
          path="/auth/register" 
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          } 
        />
        <Route 
          path="/auth" 
          element={
            <GuestRoute>
              <Auth />
            </GuestRoute>
          } 
        />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />

        {/* Clinical Onboarding Setup */}
        <Route 
          path="/onboarding" 
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          } 
        />

        {/* Protected SaaS Application */}
        <Route 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/assistant" element={<Navigate to="/ai-assistant" replace />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

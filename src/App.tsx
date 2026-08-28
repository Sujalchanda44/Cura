import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingLayout from '@/layouts/LandingLayout';
import Landing from '@/pages/Landing';
import AuthLayout from '@/layouts/AuthLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Bypass auth and start directly at the onboarding (user input) page */}
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        
        <Route path="/landing" element={<LandingLayout />}>
          <Route index element={<Landing />} />
        </Route>
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

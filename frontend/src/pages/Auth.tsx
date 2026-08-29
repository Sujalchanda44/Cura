import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Mail, Lock, User, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialTab = location.pathname.includes('register') 
    ? 'register' 
    : (tabParam === 'register' ? 'register' : 'login');

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    initialTab as any
  );

  const { login, register, loginWithGoogle, forgotPassword, resetPassword, isLoading, error, clearError } = useAuth();

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Custom feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname.includes('register') || tabParam === 'register') {
      setActiveTab('register');
    } else if (location.pathname.includes('login') || tabParam === 'login') {
      setActiveTab('login');
    }
  }, [location.pathname, tabParam]);

  // Handle Tab changes
  const handleTabChange = (tab: 'login' | 'register' | 'forgot' | 'reset') => {
    setSuccessMessage(null);
    setValidationError(null);
    clearError();
    setActiveTab(tab);
  };

  // Password validation helper
  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email || !password) {
      setValidationError('Please fill in both email and password.');
      return;
    }

    const success = await login({ email, password });
    if (success) {
      // AuthProvider will update user state and route guard will automatically navigate
      // or we can redirect directly
      setSuccessMessage('Login successful! Redirecting...');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email || !password || !name) {
      setValidationError('Please provide your name, email, and password.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setValidationError(passError);
      return;
    }

    const success = await register({ email, password, name });
    if (success) {
      setSuccessMessage('Account created successfully! Preparing onboarding...');
      setTimeout(() => {
        navigate('/onboarding');
      }, 1000);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email) {
      setValidationError('Please enter your registered email address.');
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setSuccessMessage('Password recovery instructions sent to your email.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!password || !confirmPassword) {
      setValidationError('Please enter and confirm the new password.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setValidationError(passError);
      return;
    }

    const success = await resetPassword(password);
    if (success) {
      setSuccessMessage('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        handleTabChange('login');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-6 relative overflow-hidden font-sans select-none">
      {/* Background blur accents */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl -z-10" />

      {/* Back Button */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors bg-white border border-slate-200/60 shadow-sm px-4 py-2 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Main Auth Container */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {activeTab === 'login' && 'Sign in to Cura+'}
            {activeTab === 'register' && 'Create your health account'}
            {activeTab === 'forgot' && 'Reset your password'}
            {activeTab === 'reset' && 'Create new password'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'login' && "Access your personalized health logs"}
            {activeTab === 'register' && 'Start tracking your clinical metrics today'}
            {activeTab === 'forgot' && 'Provide email recovery details'}
            {activeTab === 'reset' && 'Enter your new account password'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
          {/* Notifications */}
          <AnimatePresence mode="wait">
            {(error || validationError) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-start gap-3"
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error || validationError}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-start gap-3"
              >
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form switch */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => handleTabChange('forgot')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Register Account'}
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Send Reset Instructions'}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-blue-600 pt-2 block"
              >
                Cancel and return to Login
              </button>
            </form>
          )}

          {activeTab === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}

          {/* Social Sign In (Only for Login & Register Tabs) */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <div className="mt-6">
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200/60"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-slate-200/60"></div>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher Footer Links */}
        <div className="text-center mt-6">
          {activeTab === 'login' && (
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <button 
                onClick={() => handleTabChange('register')} 
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Register here
              </button>
            </p>
          )}

          {activeTab === 'register' && (
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <button 
                onClick={() => handleTabChange('login')} 
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

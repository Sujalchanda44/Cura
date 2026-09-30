import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Mail, Lock, User, ArrowLeft, RefreshCw, KeyRound, Eye, EyeOff, Activity, Heart, Sparkles, Zap } from 'lucide-react';
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

  const { user, logout, login, register, forgotPassword, resetPassword, isLoading, error, clearError } = useAuth();

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Email validation helper to catch typos like t6.@gmail.com
  const validateEmail = (emailStr: string): string | null => {
    const clean = emailStr.trim();
    if (!clean) return 'Please enter your email address.';
    const emailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean) || clean.includes('..') || clean.endsWith('.')) {
      return 'Please enter a valid email format (e.g. name@example.com).';
    }
    return null;
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

    const emailErr = validateEmail(email);
    if (emailErr) {
      setValidationError(emailErr);
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    const success = await login({ email, password });
    if (success) {
      sessionStorage.removeItem('cura_just_registered');
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!name.trim()) {
      setValidationError('Please provide your full name.');
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setValidationError(emailErr);
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setValidationError(passError);
      return;
    }

    const success = await register({ email, password, name });
    if (success) {
      sessionStorage.setItem('cura_just_registered', 'true');
      setSuccessMessage('Account created! Taking you to health onboarding...');
      navigate('/onboarding', { replace: true });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    const emailErr = validateEmail(email);
    if (emailErr) {
      setValidationError(emailErr);
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
    <div className={`min-h-screen font-sans select-none relative overflow-x-hidden ${
      activeTab === 'register' 
        ? 'w-full bg-[#0D1109] flex flex-col justify-between' 
        : 'bg-[#FBFDF8] flex flex-col justify-center items-center px-6 overflow-hidden'
    }`}>
      {/* Background blur accents for non-register */}
      {activeTab !== 'register' && (
        <>
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#C1F3BA]/20 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#15E6CD]/15 rounded-full blur-3xl -z-10" />
        </>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className={`absolute top-6 left-6 z-30 inline-flex items-center gap-2 text-sm font-semibold transition-colors px-4 py-2 rounded-xl shadow-sm ${
          activeTab === 'register'
            ? 'text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md'
            : 'text-slate-700 hover:text-[#134E2F] bg-white border border-slate-200/80'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Register Tab: Full Screen Edge-to-Edge Split Layout (50/50 exactly in the middle) */}
      {activeTab === 'register' ? (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative">
          {/* Left Side: Medical Vital Animation & Interactive Showcase (Full Screen) */}
          <div className="bg-[#0C120A] text-white p-8 sm:p-14 lg:p-20 flex flex-col justify-between relative overflow-hidden min-h-[500px] lg:min-h-screen">
            {/* Glowing decorative ambient orbs using soft light green */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C1F3BA]/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#C1F3BA]/10 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C1F3BA]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header inside left panel */}
            <div className="relative z-10 pt-10 sm:pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C1F3BA]/15 border border-[#C1F3BA]/30 text-[#C1F3BA] text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#C1F3BA] animate-ping" />
                <span>Bio-Telemetry System Active</span>
              </div>
              <Logo size="lg" className="mb-4" textClassName="text-white" />
            </div>

            {/* Centerpiece: Full-Scale Heart Pulse & Wide ECG Waveform */}
            <div className="relative my-auto py-10 z-10 flex flex-col items-center w-full max-w-xl mx-auto">
              {/* Beating Heart Node with Glow Waves */}
              <div className="relative mb-8 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.45, 1, 1.3, 1], opacity: [0.7, 0.1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="absolute w-28 h-28 rounded-full bg-red-500/25 blur-xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-3xl bg-[#1A0E10] border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_35px_rgba(239,68,68,0.4)] z-10"
                >
                  <Heart className="w-10 h-10 fill-red-500/25 text-red-500" />
                </motion.div>
              </div>

              {/* Full SVG ECG Waveform */}
              <div className="w-full bg-[#140F11]/90 backdrop-blur-md border border-red-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-white/5">
                  <span className="flex items-center gap-2 text-red-400 font-semibold">
                    <Activity className="w-4 h-4 animate-pulse text-red-500" /> LEAD II CONTINUOUS ECG
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-red-400 text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                    </span>
                    <span className="text-white font-bold tracking-wider text-sm">72 <span className="text-slate-400 text-xs font-normal">BPM</span></span>
                  </div>
                </div>

                <div className="h-28 sm:h-36 w-full relative flex items-center">
                  <svg viewBox="0 0 600 100" className="w-full h-full stroke-current overflow-visible" preserveAspectRatio="none">
                    {/* Background grid */}
                    <line x1="0" y1="25" x2="600" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                    {/* Static echo trace */}
                    <path
                      d="M0,50 L80,50 L95,48 L105,52 L115,50 L150,50 L160,32 L168,75 L180,10 L192,90 L198,50 L215,50 L230,42 L245,50 L320,50 L330,32 L338,75 L350,10 L362,90 L368,50 L385,50 L400,42 L415,50 L480,50 L490,32 L498,75 L510,10 L522,90 L528,50 L545,50 L560,42 L575,50 L600,50"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeOpacity="0.25"
                    />

                    {/* Animated sweeping pulse line */}
                    <motion.path
                      d="M0,50 L80,50 L95,48 L105,52 L115,50 L150,50 L160,32 L168,75 L180,10 L192,90 L198,50 L215,50 L230,42 L245,50 L320,50 L330,32 L338,75 L350,10 L362,90 L368,50 L385,50 L400,42 L415,50 L480,50 L490,32 L498,75 L510,10 L522,90 L528,50 L545,50 L560,42 L575,50 L600,50"
                      fill="none"
                      stroke="#FF3B30"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(255, 59, 48, 0.85))' }}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: [0, 1, 1],
                        opacity: [0, 1, 0.4],
                        pathOffset: [0, 0, 1]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.6,
                        ease: "easeInOut"
                      }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Telemetry Footer */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C1F3BA]" />
                <span>Next-Gen Medical Telemetry Active</span>
              </span>
              <span className="font-mono text-xs text-[#C1F3BA]/90 font-bold">CURA+ OS v2.4</span>
            </div>
          </div>

          {/* Middle Separation Divider with light mint green line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 z-20 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-[#C1F3BA]/50 via-50% to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#C1F3BA]/30 blur-sm" />
          </div>

          {/* Right Side: Registration Form (Full Height, 50% split with subtle light border) */}
          <div className="bg-[#FAFDF4] p-8 sm:p-14 lg:p-16 xl:p-20 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#C1F3BA]/40 min-h-screen relative shadow-[-10px_0_30px_rgba(0,0,0,0.04)]">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#134E2F] bg-[#C1F3BA] px-3 py-1 rounded-lg">
                    New Account
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="text-xs font-bold text-slate-500 hover:text-[#134E2F] transition-colors"
                  >
                    Already a member? <span className="underline text-[#134E2F]">Sign In</span>
                  </button>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Start Your Health Journey
                </h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Register now and unlock your personalized medical onboarding profile.
                </p>
              </div>

              {/* Already logged in notice */}
              {user && (
                <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-amber-800">Currently logged in:</span>{' '}
                    <span className="text-amber-900 font-bold">{user.name || user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-bold transition-colors"
                  >
                    Log Out to Register
                  </button>
                </div>
              )}

              {/* Notifications */}
              <AnimatePresence mode="wait">
                {(error || validationError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 p-4 bg-[#FF6554]/10 border border-[#FF6554]/30 text-[#D93D2C] text-xs font-semibold rounded-2xl flex items-start gap-3"
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
                    className="mb-5 p-4 bg-[#C1F3BA]/30 border border-[#C1F3BA] text-[#134E2F] text-xs font-bold rounded-2xl flex items-start gap-3"
                  >
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Elena Vance"
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1F3BA]/50 transition-all font-medium shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1F3BA]/50 transition-all font-medium shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-11 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1F3BA]/50 transition-all font-medium shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold py-4 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer text-base"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        <span>Create Health Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>By continuing, you accept our Health Terms.</span>
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="font-bold text-[#134E2F] hover:underline"
                >
                  Sign In instead →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Auth Container (For Login, Forgot, Reset) */
        <div className="w-full max-w-md my-auto py-12">
          <div className="text-center mb-8">
            <Logo size="lg" className="justify-center mb-4" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {activeTab === 'login' && 'Sign in to Cura+'}
              {activeTab === 'forgot' && 'Reset your password'}
              {activeTab === 'reset' && 'Create new password'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {activeTab === 'login' && "Access your personalized health logs"}
              {activeTab === 'forgot' && 'Provide email recovery details'}
              {activeTab === 'reset' && 'Enter your new account password'}
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl p-8">
            {/* Notifications */}
            <AnimatePresence mode="wait">
              {(error || validationError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-[#FF6554]/10 border border-[#FF6554]/30 text-[#D93D2C] text-xs font-semibold rounded-2xl flex items-start gap-3"
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
                  className="mb-6 p-4 bg-[#C1F3BA]/20 border border-[#C1F3BA] text-[#134E2F] text-xs font-bold rounded-2xl flex items-start gap-3"
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
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
                      className="w-full bg-[#FAFDF4] border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-xs font-semibold text-slate-600 hover:text-[#134E2F] focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FAFDF4] border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-11 py-3.5 text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-black focus:ring-[#C1F3BA] border-slate-300 cursor-pointer accent-[#C1F3BA]"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold py-4 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
              </form>
            )}

            {/* Forgot Password */}
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
                      className="w-full bg-[#FAFDF4] border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold py-4 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Send Reset Instructions'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#134E2F] pt-2 block"
                >
                  Cancel and return to Login
                </button>
              </form>
            )}

            {/* Reset Password */}
            {activeTab === 'reset' && (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FAFDF4] border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-11 py-3.5 text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FAFDF4] border border-slate-200 hover:border-slate-300 focus:border-[#C1F3BA] rounded-2xl pl-11 pr-11 py-3.5 text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold py-4 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Tab Switcher Footer Links (for login view) */}
          {activeTab === 'login' && (
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={() => handleTabChange('register')}
                  className="font-bold text-[#134E2F] hover:underline"
                >
                  Register here
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

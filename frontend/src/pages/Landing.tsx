import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Shield, Brain,
  ArrowRight, Apple,
  Droplet, Moon, Pill, FileText, ScanBarcode,
  LayoutDashboard
} from 'lucide-react';
import { Logo } from '@/components/Logo';

import { useAuth } from '@/hooks/useAuth';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  // Animation constants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: custom * 0.1, ease: 'easeOut' as any }
    })
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFDF8] text-slate-900 overflow-x-hidden font-sans selection:bg-[#C1F3BA] selection:text-[#134E2F]">
      {/* Premium Header/Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full rounded-b-2xl">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => logout()}
                className="text-sm font-semibold text-slate-500 hover:text-[#FF6554] transition-colors px-3 py-2"
              >
                Sign Out
              </button>
              <button
                onClick={() => {
                  const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
                  navigate((!user.isOnboarded && isFreshRegistration && user.role !== 'admin') ? '/onboarding' : '/dashboard');
                }}
                className="text-sm font-bold text-[#134E2F] bg-[#C1F3BA] hover:bg-[#ADE8A5] transition-all rounded-xl px-5 py-2.5 shadow-md shadow-[#C1F3BA]/30 hover:scale-[1.02] flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Dashboard</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth/login')}
                className="text-sm font-semibold text-slate-700 hover:text-[#134E2F] transition-colors px-4 py-2"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                className="text-sm font-bold text-[#134E2F] bg-[#C1F3BA] hover:bg-[#ADE8A5] transition-all rounded-xl px-5 py-2.5 shadow-md shadow-[#C1F3BA]/30 hover:scale-[1.02]"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-6 pb-20 px-6 max-w-7xl mx-auto">
        {/* Ambient Lime Glow Effect */}
        <div className="absolute top-12 left-1/4 -translate-x-1/2 w-96 h-96 bg-[#C1F3BA]/25 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />

        {/* Hero Banner Box inspired by reference image */}
        <div className="bg-[#C1F3BA] rounded-[2.5rem] p-8 md:p-14 text-[#0E2818] relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Subtle curved line pattern / sparkles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 border-[40px] border-white/20 rounded-full pointer-events-none" />

          <div className="flex-1 max-w-xl text-left">
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#0E2818]"
            >
              Health for the Future
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-6 text-base sm:text-lg text-[#0E2818]/80 font-medium leading-relaxed"
            >
              Work with all the necessary vital telemetry and clinical AI intelligence to boost daily wellness, protect allergens, and maximize longevity using Cura+.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {isAuthenticated && user ? (
                <button
                  onClick={() => {
                    const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
                    navigate((!user.isOnboarded && isFreshRegistration && user.role !== 'admin') ? '/onboarding' : '/dashboard');
                  }}
                  className="inline-flex items-center gap-2 bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-[#134E2F]/20 transition-all hover:scale-[1.02]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Clinical Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/auth/register')}
                    className="inline-flex items-center gap-2 bg-[#134E2F] text-white hover:bg-[#0E3B23] font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-[#134E2F]/20 transition-all hover:scale-[1.02]"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-[#134E2F] font-bold px-6 py-3.5 rounded-2xl shadow-sm transition-all"
                  >
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>

          {/* Hero Floating Mockup Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:max-w-md flex flex-col gap-4"
          >
            {/* Clean Frosted Vitals Card */}
            <div className="bg-white/95 backdrop-blur-xl text-slate-900 p-6 rounded-3xl shadow-2xl border border-white relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C1F3BA] text-[#134E2F] flex items-center justify-center font-black shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Daily Health Vitals</h4>
                    <p className="text-[11px] text-slate-500">Continuous Clinical Telemetry</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">+8.4% Optimal</span>
              </div>

              {/* Vitals Quick Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div className="bg-[#F0FDFA] p-3 rounded-2xl border border-teal-100/70 shadow-sm">
                  <Droplet className="w-4 h-4 text-teal-600 mb-1" />
                  <span className="text-[10px] text-slate-500 font-medium block">Hydration</span>
                  <span className="font-black text-xs text-slate-900">2.2 / 2.5L</span>
                </div>
                <div className="bg-[#F7FEE7] p-3 rounded-2xl border border-lime-100/70 shadow-sm">
                  <Moon className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] text-slate-500 font-medium block">Sleep</span>
                  <span className="font-black text-xs text-slate-900">7h 45m</span>
                </div>
                <div className="bg-[#FFF1F2] p-3 rounded-2xl border border-rose-100/70 shadow-sm">
                  <Apple className="w-4 h-4 text-rose-500 mb-1" />
                  <span className="text-[10px] text-slate-500 font-medium block">Calories</span>
                  <span className="font-black text-xs text-slate-900">520 kcal</span>
                </div>
              </div>
            </div>

            {/* Light Glass Card 2: Interactive AI Assistant Prompt */}
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-white text-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#134E2F] text-[#C1F3BA] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  C+
                </div>
                <div className="bg-[#FAFDF4] border border-slate-200/80 p-3 rounded-2xl text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Clinical AI Guard</span>
                  No peanut allergens detected in your scanned lunch. High protein target achieved!
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 bg-white border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Supercharged Health Tracking
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Cura+ automates your vitals and connects health records with advanced AI suggestions.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#134E2F] text-[#C1F3BA] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md shadow-[#134E2F]/15">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Nutrition AI Assistant</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect and talk with our smart LLM health coach trained to guard allergies and suggest tailored diet catalogs.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C1F3BA] text-[#134E2F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform font-bold shadow-md shadow-[#C1F3BA]/30">
                <ScanBarcode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">OCR Food Barcode Scanner</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instantly take photos of ingredient lists or type barcode labels to filter contents, identify fats, and log meals.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E6FAF7] text-[#0D9488] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Today's Health Score</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Aggregate water tracking, heart rates, sleep durations, and calorie burn targets into a unified score indicator.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Medicine Reminders</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Configure medicine intake times, daily frequencies, dosage targets, and get notified about active alarms.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Weekly Health Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Compile weekly trends, macros, calorie deficit percentages, and heart rate baselines into exportable PDF summaries.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-3xl bg-[#FAFDF4] border border-slate-200/80 hover:border-[#C1F3BA] hover:shadow-xl hover:shadow-[#C1F3BA]/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF6554]/15 text-[#FF6554] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">HIPAA-Level Security</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sensitive medical logs are fully encrypted on the database using military-grade AES-256-GCM architecture.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 bg-[#FAFDF4]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-slate-900 text-base mb-2">How does the allergy guard work?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you define your health profile onboarding allergies, the backend recommendation and chat engines pre-screen ingredients. The OCR barcode lookup instantly cross-matches food allergens and returns warnings.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-slate-900 text-base mb-2">Is my personal health data encrypted?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Absolutely. All personal medical lists and conditions are encrypted at-rest in our database using standard AES-256-GCM configurations. Nobody can read them without proper authentication keys.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-slate-900 text-base mb-2">Can I access Cura+ on both mobile and desktop?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Yes! Cura+ is fully responsive and works smoothly across all your devices. Your logs, nutrition scans, and vitals sync instantly so you can stay updated wherever you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B2416] text-slate-300 py-16 px-6 border-t border-[#134E2F]/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo size="md" showText={true} textClassName="text-white" />
            <p className="text-xs text-white/50 mt-2">© 2026 Cura+ Health. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
            <a href="#" className="hover:text-[#C1F3BA] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#C1F3BA] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#C1F3BA] transition-colors">Security</a>
            <a href="#" className="hover:text-[#C1F3BA] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

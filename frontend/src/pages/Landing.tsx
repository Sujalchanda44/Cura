import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, Shield, Brain, Sparkles, 
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Premium Header/Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full rounded-b-2xl">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => logout()}
                className="text-sm font-semibold text-slate-500 hover:text-rose-600 transition-colors px-3 py-2"
              >
                Sign Out
              </button>
              <button 
                onClick={() => navigate(user.isOnboarded ? '/dashboard' : '/onboarding')}
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-xl px-5 py-2.5 shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Dashboard</span>
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => navigate('/auth/login')}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/auth/register')}
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-xl px-5 py-2.5 shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Animated Background blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl -z-10" />

        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <motion.div 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Healthcare SaaS Platform</span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent"
          >
            Your AI-Powered Personal <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Health Companion</span>
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-lg text-slate-600 leading-relaxed"
          >
            Cura+ integrates real-time biometrics, visual food scanning, and personalized LLM guidance to secure your health, safeguard food allergies, and design your optimal daily lifestyle.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            {isAuthenticated && user ? (
              <button
                onClick={() => navigate(user.isOnboarded ? '/dashboard' : '/onboarding')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 group"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Clinical Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth/register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/auth/login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-8 py-4 rounded-2xl shadow-sm transition-all"
                >
                  <span>Sign In</span>
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Hero Interactive UI Preview Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full max-w-xl bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          {/* Decorative glass elements */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
          
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Health Score</h4>
                  <p className="text-xs text-slate-400">Calculated today</p>
                </div>
              </div>
              <span className="text-2xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">88%</span>
            </div>

            {/* Simulated chat widget */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                  C+
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none text-xs text-slate-600 max-w-[85%]">
                  Hello! I've analyzed your breakfast log. Your peanuts allergy has been strictly flagged. Let's design a safer protein alternative!
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%]">
                  Sounds great, thanks! What about pumpkin seeds?
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  JD
                </div>
              </div>
            </div>

            {/* Biometric progress circles */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/50 rounded-xl p-3 text-center border border-slate-100/50">
                <Droplet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block">Water</span>
                <span className="font-bold text-xs text-slate-700">1.8 / 2.5L</span>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-3 text-center border border-slate-100/50">
                <Moon className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block">Sleep</span>
                <span className="font-bold text-xs text-slate-700">7.5 Hours</span>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-3 text-center border border-slate-100/50">
                <Apple className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block">Calories</span>
                <span className="font-bold text-xs text-slate-700">540 / 1800</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 bg-white border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Supercharged Health Tracking
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              Cura+ automates your metric pipelines and connects medical records with advanced AI suggestions.
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
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Nutrition AI Assistant</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect and talk with our smart LLM health coach trained to guard allergies and suggest tailored diet catalogs.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              variants={fadeInUp} 
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ScanBarcode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">OCR Food Barcode Scanner</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instantly take photos of ingredient lists or type barcode labels to filter contents, identify fats, and log meals.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              variants={fadeInUp} 
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Today's Health Score</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Aggregate water tracking, heart rates, sleep durations, and calorie burn targets into a unified score indicator.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              variants={fadeInUp} 
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Medicine Reminders</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Configure medicine intake times, daily frequencies, dosage targets, and get notified about active alarms.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              variants={fadeInUp} 
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Weekly PDF Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Compile weekly trends, macros, calorie deficit percentages, and heart rate baselines into exportable PDF summaries.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              variants={fadeInUp} 
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">HIPAA-Level Security</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sensitive medical logs are fully encrypted on the database using military-grade AES-256-GCM architecture.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-800">Loved by Health Enthusiasts</h2>
            <p className="mt-3 text-slate-600">Hear from our members who restructured their health tracking routine.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <p className="text-slate-600 italic">"The allergen warning feature alone saved me multiple times. I just snap a photo of my meal box, and Cura+ tells me if peanut traces are present."</p>
              <div className="mt-6 flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80" className="w-10 h-10 rounded-full object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Sarah Jenkins</h4>
                  <p className="text-[10px] text-slate-400">Nutritional Coach</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <p className="text-slate-600 italic">"Zustand state caching and Supabase syncing are lightning fast. I can log my water intake from my phone and it reflects instantly on my laptop."</p>
              <div className="mt-6 flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" className="w-10 h-10 rounded-full object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Marcus Brody</h4>
                  <p className="text-[10px] text-slate-400">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <p className="text-slate-600 italic">"The PDF export makes sharing metrics with my doctor extremely easy. It bundles my averages and BMI logs in a clean 1-page layout."</p>
              <div className="mt-6 flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" className="w-10 h-10 rounded-full object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Dr. Evelyn Chen</h4>
                  <p className="text-[10px] text-slate-400">Primary Care Physician</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-base mb-2">How does the peanut allergy guard work?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you define your health profile onboarding allergies, the backend recommendation and chat engines pre-screen ingredients. The OCR barcode lookup instantly cross-matches food allergens and returns warnings.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-base mb-2">Is my personal health data encrypted?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Absolutely. All personal medical lists and conditions are encrypted at-rest in our database using standard AES-256-GCM configurations. Nobody can read them without proper authentication keys.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-base mb-2">Can I use Cura+ without configuring Supabase?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Yes! The application detects Supabase credentials dynamically. If you don't configure Supabase keys, Cura+ runs perfectly in offline-mode using local, zero-dependency storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo size="md" showText={true} className="brightness-125" />
            <p className="text-xs text-slate-500 mt-2">© 2026 Cura+ Health. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Check, CheckCircle2, Droplets, Flame,
  Footprints, Heart, Loader2, Moon, Plus,
  Scale, X, Clock, CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, getLocalDateString } from '@/lib/utils';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  getHealthDashboard, getNotifications, toggleReminder,
  logDailyMetric, createMedicineReminder
} from '@/api/healthApi';
import { getUserProfile } from '@/api/userApi';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';


// -------------------------------------------------------------
// Pure SVG Circular Progress Ring Component
// -------------------------------------------------------------
function CircularRing({
  value,
  max = 100,
  size = 54,
  strokeWidth = 4,
  color = '#134E2F',
  label
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: React.ReactNode;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-[#273322]"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-[11px] font-black text-slate-800 dark:text-slate-100 text-center leading-none">
        {label !== undefined ? label : `${Math.round(percent)}%`}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Health Dashboard
// -------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, healthProfile } = useAuth();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);

  // Weekly metric switcher: Steps, Sleep, Water, Calories, Heart Rate
  const [chartMetric, setChartMetric] = useState<'steps' | 'sleepHours' | 'waterIntake' | 'caloriesBurned' | 'heartRate'>('steps');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (last index in 7-day window)


  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSteps, setLogSteps] = useState('5000');
  const [logWater, setLogWater] = useState('2.0');
  const [logSleep, setLogSleep] = useState('7.5');
  const [logCalories, setLogCalories] = useState('350');
  const [logWorkout, setLogWorkout] = useState('30');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Add Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00 AM');
  const [reminderType, setReminderType] = useState('medicine');
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  // Safeguard: Only redirect to /onboarding if this is explicitly a fresh registration in the active session
  useEffect(() => {
    const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
    if (user && !user.isOnboarded && isFreshRegistration && user.role !== 'admin') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);


  const fetchData = async () => {
    try {
      const todayStr = getLocalDateString();
      const [dashboard, profile, notifications] = await Promise.all([
        getHealthDashboard(todayStr).catch(() => null),
        getUserProfile().catch(() => null),
        getNotifications().catch(() => [])
      ]);

      setDashboardData(dashboard);
      setProfileData(profile);
      setMedications(notifications || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleReminder = async (id: string) => {
    try {
      await toggleReminder(id);
      const notifications = await getNotifications();
      setMedications(notifications || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling reminder:', error);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    setIsSavingReminder(true);
    try {
      await createMedicineReminder({
        title: reminderTitle.trim(),
        time: reminderTime,
        dosage: reminderType === 'medicine' ? '1 dose' : undefined,
        type: reminderType
      });
      const notifications = await getNotifications();
      setMedications(notifications || []);
      setIsReminderModalOpen(false);
      setReminderTitle('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to create reminder:', err);
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleSaveDailyMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasLoggedToday) {
      setLogError("You have already submitted your daily health metrics for today. Only 1 log is permitted per day.");
      return;
    }

    setLogError(null);
    setIsSavingLog(true);
    try {
      await logDailyMetric({
        steps: Number(logSteps),
        waterMl: Math.round(Number(logWater) * 1000),
        sleepHours: Number(logSleep),
        activeCaloriesBurnt: Number(logCalories),
        exerciseDuration: Number(logWorkout),
        date: getLocalDateString()
      });
      await fetchData();
      setIsLogModalOpen(false);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Failed to log daily metric:', err);
      const apiMsg = err.response?.data?.message || err.message || 'Failed to log daily metric. Please try again.';
      setLogError(apiMsg);
    } finally {
      setIsSavingLog(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F8FAFC] dark:bg-[#0D1109]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#134E2F] dark:text-[#C1F3BA]" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading your visual health dashboard...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Data extraction & Clinical Telemetry
  // -------------------------------------------------------------
  const name = user?.name || profileData?.name || 'User';
  const activeProfile = profileData?.healthProfile || healthProfile;
  const weight = activeProfile?.weightKg ?? null;
  const height = activeProfile?.heightCm ?? null;

  let bmi = activeProfile?.bmi ?? null;
  let bmiCategory = activeProfile?.bmiCategory ?? null;

  if (!bmi && weight && height) {
    const hM = height / 100;
    bmi = Number((weight / (hM * hM)).toFixed(1));
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';
  }

  // Real metrics for today
  const stepsCurrent = dashboardData?.metrics?.steps?.current ?? 0;
  const stepsTarget = activeProfile?.targets?.steps ?? 8000;

  const waterCurrent = (dashboardData?.metrics?.waterIntake?.current ?? 0) / 1000;
  const waterTarget = (dashboardData?.metrics?.waterIntake?.target ?? activeProfile?.targets?.waterMl ?? 2500) / 1000;

  const caloriesBurned = dashboardData?.metrics?.caloriesBurned?.current ?? 0;
  const sleepHours = dashboardData?.metrics?.sleep?.current ?? 0;
  const exerciseMinutes = dashboardData?.metrics?.exerciseDuration?.current ?? 0;
  const nutritionCalories = dashboardData?.nutritionTotals?.calories ?? 0;

  // Determine if metrics have been recorded today (1 submission per day rule)
  const hasLoggedToday = Boolean(
    dashboardData?.isDailyLogSubmitted ??
    (stepsCurrent > 0 || waterCurrent > 0 || sleepHours > 0 || exerciseMinutes > 0 || caloriesBurned > 0)
  );

  // Health Score
  const hasScore = hasLoggedToday && dashboardData?.healthScore?.score !== undefined;
  const score = hasScore ? dashboardData.healthScore.score : null;
  const scoreStatus = hasScore ? (dashboardData.healthScore.status || 'Good') : 'Pending Log';

  const sleepHoursInt = Math.floor(sleepHours);
  const sleepMins = Math.round((sleepHours % 1) * 60);
  const sleepStr = sleepHours > 0 ? `${sleepHoursInt}h ${sleepMins}m` : '0h 0m';

  // Measurements
  const measurements = activeProfile?.measurements || {};
  const heartRate = measurements?.restingHeartRate || activeProfile?.restingHeartRate || null;
  const completionPercent = activeProfile?.completionPercentage || (activeProfile?.isOnboarded ? 100 : 80);

  // Allergies & Conditions for Shield
  const allergies = activeProfile?.allergies || [];
  const medicalConditions = activeProfile?.medicalConditions || [];

  // -------------------------------------------------------------
  // 7-Day Chart History & Activity Trends
  // -------------------------------------------------------------
  const chartHistory = dashboardData?.chartHistory || [];

  // Format Recharts data based on active metric (7 items, instant inline calculation)
  const chartData = chartHistory.map((day: any) => {
    let val = 0;
    if (chartMetric === 'steps') val = day.steps || 0;
    else if (chartMetric === 'sleepHours') val = day.sleepHours || 0;
    else if (chartMetric === 'waterIntake') val = Number(((day.waterIntake || 0) / 1000).toFixed(1));
    else if (chartMetric === 'caloriesBurned') val = day.caloriesBurned || 0;
    else if (chartMetric === 'heartRate') val = heartRate || 72;

    return {
      name: day.day,
      value: val,
      raw: day
    };
  });

  const getMetricLabel = () => {
    switch (chartMetric) {
      case 'steps': return 'Steps';
      case 'sleepHours': return 'Sleep (Hours)';
      case 'waterIntake': return 'Water (L)';
      case 'caloriesBurned': return 'Calories Burned (kcal)';
      case 'heartRate': return 'Heart Rate (BPM)';
    }
  };

  // Weekly Activity Matrix: Days summary
  const weeklyDays = chartHistory.length === 7 ? chartHistory : [
    { day: 'Thu', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Fri', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Sat', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Sun', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Mon', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Tue', steps: 0, waterIntake: 0, sleepHours: 0 },
    { day: 'Wed', steps: stepsCurrent, waterIntake: waterCurrent * 1000, sleepHours: sleepHours }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 p-1 sm:p-2 selection:bg-[#C1F3BA] selection:text-[#0D1109]">

      {/* ========================================================= */}
      {/* 1. TOP HEADER: WELCOME + HEALTH PROFILE COMPLETION BADGE */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-[#151A12]/90 border border-slate-200/80 dark:border-[#273322] p-4 sm:p-5 rounded-3xl backdrop-blur-xl shadow-xs transition-colors"
      >
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center flex-wrap gap-2">
            <span>{t('dash.welcome', 'Welcome back')},</span>
            <span className="bg-[#C1F3BA] px-2.5 py-1 rounded-xl text-[#134E2F] dark:text-[#0A0E08] inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>{name}</span>
              <span className="text-base select-none">👋</span>
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Informative Health Profile Status Pill */}
          <div className="flex items-center gap-3 bg-[#FAFDF4] dark:bg-[#1C2318] border border-slate-200/80 dark:border-[#273322] px-3.5 py-1.5 rounded-2xl shadow-xs shrink-0 h-[46px]">
            <div className="flex items-center gap-2.5">
              <CircularRing
                value={completionPercent}
                size={30}
                strokeWidth={3}
                color="#134E2F"
                label={<span className="text-[9px] font-black">{completionPercent}%</span>}
              />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">Health Profile</span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  <span className={allergies.length > 0 ? "text-emerald-600" : "text-slate-400"}>Allergies ✓</span>
                  <span className="text-slate-300">•</span>
                  <span className={weight ? "text-emerald-600" : "text-slate-400"}>Vitals ✓</span>
                  <span className="text-slate-300">•</span>
                  <span className={medicalConditions.length > 0 ? "text-emerald-600" : "text-slate-400"}>Conditions ✓</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings?tab=health')}
              className="text-[11px] font-bold text-[#134E2F] dark:text-[#C1F3BA] hover:underline pl-1 cursor-pointer"
            >
              Edit
            </button>
          </div>

          {/* Daily Log State Indicator / Action Button */}
          {hasLoggedToday ? (
            <div
              className="bg-emerald-50 dark:bg-[#1C281A] border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-semibold rounded-2xl px-4 py-2 shadow-xs select-none shrink-0 h-[46px]"
              title="Daily log already recorded for today. Cura enforces 1 log per day."
            >
              <div className="w-5 h-5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-[#C1F3BA] dark:text-[#134E2F] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex flex-col justify-center text-left">
                <span className="font-bold text-[12px] leading-tight text-emerald-950 dark:text-emerald-100">Today's Log Submitted</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium leading-tight">1 submission per day</span>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                setLogError(null);
                if (stepsCurrent > 0) setLogSteps(String(stepsCurrent));
                if (waterCurrent > 0) setLogWater(waterCurrent.toFixed(1));
                if (sleepHours > 0) setLogSleep(String(sleepHours));
                if (caloriesBurned > 0) setLogCalories(String(caloriesBurned));
                if (exerciseMinutes > 0) setLogWorkout(String(exerciseMinutes));
                setIsLogModalOpen(true);
              }}
              className="bg-[#134E2F] hover:bg-[#0E3B24] text-white flex items-center gap-2 text-xs font-bold rounded-2xl shadow-md shadow-[#134E2F]/20 px-5 h-[46px] transition-transform hover:scale-[1.02] cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Today's Metrics</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* 2. COMPACT SYMBOLIC HEALTH METRICS (LESS READING, MORE VISUAL) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Visual Health Score */}
        <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Health Score
            </span>
            <Badge variant="outline" className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 border",
              hasScore ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300" : "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300"
            )}>
              {scoreStatus}
            </Badge>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {hasScore ? score : '--'}
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>
            <CircularRing
              value={hasScore ? score : 0}
              size={44}
              strokeWidth={4}
              color="#134E2F"
              label={hasScore ? `${score}` : '—'}
            />
          </div>
        </Card>

        {/* Card 2: Weight & BMI Range */}
        <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" /> Body Mass
            </span>
            {bmiCategory && (
              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0.5 border-emerald-200 text-emerald-800 dark:text-emerald-300">
                {bmiCategory}
              </Badge>
            )}
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {weight || 50} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>

          {/* BMI Range Spectrum Visual */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
            <div className="w-1/4 bg-amber-400" title="Underweight (<18.5)" />
            <div className="w-1/2 bg-emerald-500" title="Normal (18.5 - 24.9)" />
            <div className="w-1/4 bg-rose-400" title="Overweight (>=25)" />
          </div>
        </Card>

        {/* Card 3: Water Intake (Hydration) */}
        <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> Hydration
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
              {Math.round((waterCurrent / (waterTarget || 2.5)) * 100)}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {waterCurrent.toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (waterCurrent / (waterTarget || 2.5)) * 100)}%` }}
            />
          </div>
        </Card>

        {/* Card 4: Daily Steps / Activity */}
        <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-emerald-600" /> Daily Steps
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
              {Math.min(100, Math.round((stepsCurrent / stepsTarget) * 100))}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {stepsCurrent.toLocaleString()}
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#134E2F] dark:bg-[#C1F3BA] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stepsCurrent / stepsTarget) * 100)}%` }}
            />
          </div>
        </Card>

        {/* Card 5: Sleep & Rest */}
        <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-500" /> Sleep Rest
            </span>
            <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
              {Math.min(100, Math.round((sleepHours / 8) * 100))}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {sleepStr}
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (sleepHours / 8) * 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 3. WEEKLY HEALTH ACTIVITY SECTION (SYMBOLIC 7-DAY MATRIX) */}
      {/* ========================================================= */}
      <div className="grid gap-6 lg:grid-cols-7">

        {/* Weekly Activity Trends (4 Cols) */}
        <Card className="lg:col-span-4 bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] shadow-xs rounded-3xl p-5 sm:p-6 transition-colors">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 px-0 pt-0 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Weekly Health Trends
                </CardTitle>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                  7-Day Trends
                </span>
              </div>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                Switch metric to inspect your 7-day progress and daily consistency.
              </CardDescription>
            </div>

            {/* Segmented Metric Control */}
            <div className="flex items-center bg-slate-100 dark:bg-[#1C2318] p-1 rounded-2xl border border-slate-200/60 dark:border-[#273322] overflow-x-auto max-w-full">
              {[
                { id: 'steps', label: 'Steps', icon: Footprints },
                { id: 'sleepHours', label: 'Sleep', icon: Moon },
                { id: 'waterIntake', label: 'Water', icon: Droplets },
                { id: 'caloriesBurned', label: 'Burn', icon: Flame },
                { id: 'heartRate', label: 'Heart', icon: Heart }
              ].map((btn) => {
                const Icon = btn.icon;
                const isActive = chartMetric === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => setChartMetric(btn.id as any)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                      isActive
                        ? "bg-white dark:bg-[#151A12] text-[#134E2F] dark:text-[#C1F3BA] shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* 7-Day Symbolic Matrix (Dots & Day Indicators) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-3 bg-slate-50/70 dark:bg-[#1C2318]/60 rounded-2xl border border-slate-100 dark:border-[#273322]">
              {weeklyDays.map((dayItem: any, idx: number) => {
                const isSelected = selectedDayIndex === idx;
                const isToday = idx === weeklyDays.length - 1;

                // Determine day metric value
                let val = 0;
                let target = 1;
                if (chartMetric === 'steps') {
                  val = dayItem.steps || 0;
                  target = 8000;
                } else if (chartMetric === 'sleepHours') {
                  val = dayItem.sleepHours || 0;
                  target = 8;
                } else if (chartMetric === 'waterIntake') {
                  val = (dayItem.waterIntake || 0) / 1000;
                  target = 2.5;
                } else if (chartMetric === 'caloriesBurned') {
                  val = dayItem.caloriesBurned || 0;
                  target = 400;
                } else {
                  val = heartRate || 72;
                  target = 100;
                }

                const ratio = Math.min(100, Math.round((val / target) * 100));
                const isAccomplished = val > 0 && ratio >= 75;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer text-center",
                      isSelected
                        ? "bg-white dark:bg-[#151A12] ring-2 ring-[#134E2F] dark:ring-[#C1F3BA] shadow-xs"
                        : "hover:bg-white/60 dark:hover:bg-[#151A12]/50"
                    )}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{dayItem.day}</span>

                    {/* Mini Vertical Progress Pillar */}
                    <div className="w-2.5 h-10 bg-slate-200 dark:bg-slate-700 rounded-full my-1.5 flex flex-col justify-end overflow-hidden">
                      <div
                        className={cn(
                          "w-full rounded-full transition-all duration-500",
                          val === 0 ? "bg-transparent" : (isAccomplished ? "bg-emerald-500" : "bg-[#134E2F] dark:bg-[#C1F3BA]")
                        )}
                        style={{ height: `${Math.max(val > 0 ? 15 : 0, ratio)}%` }}
                      />
                    </div>

                    {/* Status Dot / Highlight */}
                    <div className="flex items-center justify-center">
                      {val > 0 ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>

                    {isToday && (
                      <span className="text-[9px] font-extrabold text-[#134E2F] dark:text-[#C1F3BA] mt-1">Today</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recharts Area Curve */}
            <div className="h-[210px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="curaTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C1F3BA" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#C1F3BA" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                  <Tooltip
                    formatter={(val) => [val, getMetricLabel()]}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #88888830',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
                      background: 'rgba(21, 26, 18, 0.95)',
                      color: '#FFFFFF'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#134E2F" strokeWidth={2.5} fillOpacity={1} fill="url(#curaTrendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Today's Goals & Timeline Reminders (3 Cols) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">

          {/* Today's Goals Card */}
          <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] shadow-xs rounded-3xl p-5 sm:p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#134E2F] dark:text-[#C1F3BA]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Today's Goals</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {([waterCurrent >= waterTarget, stepsCurrent >= stepsTarget, sleepHours >= 7, nutritionCalories > 0].filter(Boolean).length)}/4 Complete
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Goal 1: Water */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Hydration Goal</span>
                    <span className="text-[11px] text-slate-400">{waterCurrent.toFixed(1)} / {waterTarget.toFixed(1)} L</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (waterCurrent / (waterTarget || 2.5)) * 100)}%` }}
                    />
                  </div>
                  {waterCurrent >= waterTarget ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{Math.round((waterCurrent / (waterTarget || 2.5)) * 100)}%</span>
                  )}
                </div>
              </div>

              {/* Goal 2: Steps */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Step Target</span>
                    <span className="text-[11px] text-slate-400">{stepsCurrent.toLocaleString()} / {stepsTarget.toLocaleString()} steps</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (stepsCurrent / stepsTarget) * 100)}%` }}
                    />
                  </div>
                  {stepsCurrent >= stepsTarget ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{Math.min(100, Math.round((stepsCurrent / stepsTarget) * 100))}%</span>
                  )}
                </div>
              </div>

              {/* Goal 3: Sleep */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Restorative Sleep</span>
                    <span className="text-[11px] text-slate-400">{sleepStr} / 8.0 hrs</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (sleepHours / 8) * 100)}%` }}
                    />
                  </div>
                  {sleepHours >= 7 ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{Math.round((sleepHours / 8) * 100)}%</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline Reminders Card */}
          <Card className="bg-white/95 dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] shadow-xs rounded-3xl p-5 sm:p-6 transition-colors flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#134E2F] dark:text-[#C1F3BA]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Today's Reminders</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReminderModalOpen(true)}
                className="h-7 text-[11px] font-bold rounded-xl px-2.5"
              >
                <Plus className="w-3 h-3 mr-1" /> Reminder
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[190px] pr-1 space-y-2.5">
              {medications.length > 0 ? (
                medications.map((item: any) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-2xl border transition-all text-xs",
                      item.isActive
                        ? "bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] shadow-2xs"
                        : "bg-slate-50/60 dark:bg-[#1C2318]/40 border-slate-100 dark:border-[#273322]/50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className={cn("font-bold block text-slate-800 dark:text-slate-100", !item.isActive && "line-through")}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.time} {item.dosage ? `• ${item.dosage}` : ''}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleReminder(item.id)}
                      className={cn(
                        "h-6 w-6 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                        !item.isActive
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-emerald-600"
                      )}
                    >
                      {!item.isActive ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  <p>No active reminders scheduled for today.</p>
                  <button
                    onClick={() => setIsReminderModalOpen(true)}
                    className="text-[#134E2F] dark:text-[#C1F3BA] font-bold hover:underline mt-1 inline-block"
                  >
                    + Add your first reminder
                  </button>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>


      {/* ========================================================= */}
      {/* 5. MODAL: LOG TODAY'S HEALTH METRICS                      */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#151A12] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#273322] text-slate-900 dark:text-slate-100 relative transition-colors"
            >
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#1C2318] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Log Today's Health Metrics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Enter your daily activity and hydration stats (1 submission per day).</p>

              {hasLoggedToday && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5 mb-4">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[13px]">Today's Log Already Recorded</span>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Cura enforces a 1-log-per-day rule to protect the accuracy of your health analytics. You can log new metrics again tomorrow.
                    </span>
                  </div>
                </div>
              )}

              {logError && !hasLoggedToday && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-800 dark:text-red-200 text-xs mb-4">
                  {logError}
                </div>
              )}

              <form onSubmit={handleSaveDailyMetric} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Steps Walked</label>
                  <Input
                    type="number"
                    value={logSteps}
                    onChange={(e) => setLogSteps(e.target.value)}
                    placeholder="e.g. 7400"
                    disabled={hasLoggedToday}
                    className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Water (Liters)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={logWater}
                      onChange={(e) => setLogWater(e.target.value)}
                      placeholder="e.g. 2.5"
                      disabled={hasLoggedToday}
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Sleep (Hours)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={logSleep}
                      onChange={(e) => setLogSleep(e.target.value)}
                      placeholder="e.g. 7.5"
                      disabled={hasLoggedToday}
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Calories Burned (kcal)</label>
                      {!hasLoggedToday && (
                        <button
                          type="button"
                          onClick={() => {
                            const userW = weight || 70;
                            const s = Number(logSteps) || 0;
                            const w = Number(logWorkout) || 0;
                            const cals = Math.round(((s / 1000) * userW * 0.57) + ((6 * 3.5 * userW / 200) * w));
                            setLogCalories(String(cals));
                          }}
                          className="text-[10px] text-[#134E2F] dark:text-[#C1F3BA] font-bold hover:underline cursor-pointer"
                          title="Auto-calculate based on Steps, Workout, and Body Weight"
                        >
                          Auto-calc
                        </button>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={logCalories}
                      onChange={(e) => setLogCalories(e.target.value)}
                      placeholder="e.g. 400"
                      disabled={hasLoggedToday}
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Workout (Minutes)</label>
                    <Input
                      type="number"
                      value={logWorkout}
                      onChange={(e) => setLogWorkout(e.target.value)}
                      placeholder="e.g. 45"
                      disabled={hasLoggedToday}
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-[#273322]">
                  <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
                    {hasLoggedToday ? "Close" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingLog || hasLoggedToday}
                    className="bg-[#134E2F] hover:bg-[#0E3B23] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-6 flex items-center gap-2 shadow-md shadow-[#134E2F]/20 cursor-pointer"
                  >
                    {isSavingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{hasLoggedToday ? "Submitted for Today" : "Save Metrics"}</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 6. MODAL: ADD REMINDER                                    */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#151A12] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-[#273322] text-slate-900 dark:text-slate-100 relative"
            >
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#1C2318] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Add Daily Reminder</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Set up a scheduled prompt for medicine, hydration, or sleep.</p>

              <form onSubmit={handleCreateReminder} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-[#273322] rounded-xl p-2.5 bg-white dark:bg-[#1C2318] text-slate-800 dark:text-slate-200"
                  >
                    <option value="medicine">💊 Medicine</option>
                    <option value="water">💧 Water Check</option>
                    <option value="workout">🏃 Exercise / Walk</option>
                    <option value="sleep">🌙 Sleep Wind-down</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Title</label>
                  <Input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="e.g. Vitamin D3, Drink 500ml"
                    required
                    className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Scheduled Time</label>
                  <Input
                    type="text"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    required
                    className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#273322]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsReminderModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingReminder || !reminderTitle.trim()}
                    className="bg-[#134E2F] hover:bg-[#0E3B24] text-white font-bold"
                  >
                    {isSavingReminder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Reminder'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

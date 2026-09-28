import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, Droplets, Flame, Moon, Activity, 
  Pill, Check, Loader2, Plus, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { getHealthDashboard, getNotifications, toggleReminder, logDailyMetric } from '@/api/healthApi';
import { getUserProfile } from '@/api/userApi';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, healthProfile } = useAuth();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [chartMetric, setChartMetric] = useState<'steps' | 'sleepHours' | 'waterIntake'>('steps');

  // Safeguard: Only redirect to /onboarding if this is explicitly a fresh registration in the active session
  useEffect(() => {
    const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
    if (user && !user.isOnboarded && isFreshRegistration && user.role !== 'admin') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSteps, setLogSteps] = useState('5000');
  const [logWater, setLogWater] = useState('2.0');
  const [logSleep, setLogSleep] = useState('7.5');
  const [logCalories, setLogCalories] = useState('350');
  const [logWorkout, setLogWorkout] = useState('30');
  const [isSavingLog, setIsSavingLog] = useState(false);

  const fetchData = async () => {
    try {
      const [dashboard, profile, notifications] = await Promise.all([
        getHealthDashboard().catch(() => null),
        getUserProfile().catch(() => null),
        getNotifications().catch(() => [])
      ]);

      // Only redirect if this is explicitly a fresh registration and onboarding hasn't been completed
      const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
      if (!user?.isOnboarded && profile && profile.isOnboarded === false && isFreshRegistration && user?.role !== 'admin') {
        navigate('/onboarding', { replace: true });
        return;
      }

      setDashboardData(dashboard);
      setProfileData(profile);
      setMedications((notifications || []).filter((n: any) => n.type === 'medicine'));
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
      setMedications((notifications || []).filter((n: any) => n.type === 'medicine'));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling reminder:', error);
    }
  };

  const handleSaveDailyMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLog(true);
    try {
      await logDailyMetric({
        steps: Number(logSteps),
        waterMl: Math.round(Number(logWater) * 1000),
        sleepHours: Number(logSleep),
        activeCaloriesBurnt: Number(logCalories),
        exerciseDuration: Number(logWorkout),
        date: new Date().toISOString().split('T')[0]
      });
      await fetchData();
      setIsLogModalOpen(false);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to log daily metric:', err);
    } finally {
      setIsSavingLog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading personalized clinical dashboard...</p>
        </div>
      </div>
    );
  }

  // Real user details
  const name = user?.name || profileData?.name || 'User';
  
  // Real clinical measurements from profile
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
  
  const waterCurrent = (dashboardData?.metrics?.waterIntake?.current ?? 0) / 1000;
  const waterTarget = (dashboardData?.metrics?.waterIntake?.target ?? activeProfile?.targets?.waterMl ?? 2500) / 1000;
  
  const caloriesBurned = dashboardData?.metrics?.caloriesBurned?.current ?? 0;
  const sleepHours = dashboardData?.metrics?.sleep?.current ?? 0;
  const exerciseMinutes = dashboardData?.metrics?.exerciseDuration?.current ?? 0;

  // Determine if metrics have been recorded today
  const hasLoggedToday = stepsCurrent > 0 || waterCurrent > 0 || sleepHours > 0 || exerciseMinutes > 0 || caloriesBurned > 0;
  
  // Real health score
  const hasScore = hasLoggedToday && dashboardData?.healthScore?.score !== undefined;
  const score = hasScore ? dashboardData.healthScore.score : null;
  const scoreStatus = hasScore ? (dashboardData.healthScore.status || 'Good') : 'Pending Daily Log';

  const sleepHoursInt = Math.floor(sleepHours);
  const sleepMins = Math.round((sleepHours % 1) * 60);
  const sleepStr = sleepHours > 0 ? `${sleepHoursInt}h ${sleepMins}m` : '0h 0m';

  // Format Recharts history
  const chartData = (dashboardData?.chartHistory || []).map((day: any) => ({
    name: day.day,
    value: chartMetric === 'waterIntake' 
      ? Number(((day.waterIntake || 0) / 1000).toFixed(1)) 
      : (day[chartMetric] || 0)
  }));

  const getMetricLabel = () => {
    if (chartMetric === 'steps') return 'Steps';
    if (chartMetric === 'sleepHours') return 'Sleep (Hours)';
    return 'Water (L)';
  };

  // Structured measurements from onboarding or active profile
  const measurements = activeProfile?.measurements || {};
  const bpSys = measurements?.bloodPressureSystolic || activeProfile?.bloodPressureSystolic || null;
  const bpDia = measurements?.bloodPressureDiastolic || activeProfile?.bloodPressureDiastolic || null;
  const heartRate = measurements?.restingHeartRate || activeProfile?.restingHeartRate || null;
  const spo2 = measurements?.oxygenSaturation || activeProfile?.oxygenSaturation || null;
  const bloodGlucose = measurements?.bloodGlucose || activeProfile?.bloodGlucose || null;
  const completionPercent = activeProfile?.completionPercentage || (activeProfile?.isOnboarded ? 100 : 85);

  return (
    <div className="space-y-8 p-1">
      {/* Animated Greeting Header & Health Profile Completion Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#151A12]/90 border border-slate-200/80 dark:border-[#273322] p-6 rounded-3xl backdrop-blur-xl shadow-sm transition-colors"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {t('dash.welcome', 'Welcome back')}, <span className="bg-[#C1F3BA] px-2.5 py-0.5 rounded-lg text-[#134E2F] dark:text-[#0A0E08]">{name}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium">
            {t('dash.subtitle', 'Here is your daily personalized health and nutrition summary.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Profile Completion Badge */}
          <div className="flex items-center gap-3 bg-[#FAFDF4] dark:bg-[#1C2318] border border-slate-200/80 dark:border-[#273322] px-4 py-2 rounded-2xl shadow-sm transition-colors">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">Health Profile</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">{completionPercent}% Complete</span>
            </div>
            <div className="w-10 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="bg-[#134E2F] dark:bg-[#C1F3BA] h-full rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <button
              onClick={() => (window.location.href = '/settings')}
              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-[#134E2F] dark:hover:text-[#C1F3BA] hover:underline"
            >
              Edit
            </button>
          </div>

          <Button 
            onClick={() => {
              if (stepsCurrent > 0) setLogSteps(String(stepsCurrent));
              if (waterCurrent > 0) setLogWater(waterCurrent.toFixed(1));
              if (sleepHours > 0) setLogSleep(String(sleepHours));
              if (caloriesBurned > 0) setLogCalories(String(caloriesBurned));
              if (exerciseMinutes > 0) setLogWorkout(String(exerciseMinutes));
              setIsLogModalOpen(true);
            }}
            className="bg-[#C1F3BA] hover:bg-[#ADE8A5] text-[#134E2F] flex items-center gap-2 text-xs font-bold rounded-2xl shadow-md shadow-[#C1F3BA]/30 px-5 py-3 transition-transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Today's Metrics</span>
          </Button>
        </div>
      </motion.div>

      {/* Clinical Telemetry Snapshot Ribbon */}
      {(bpSys || heartRate || spo2 || bloodGlucose) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/90 dark:bg-[#151A12]/90 backdrop-blur-xl text-slate-800 dark:text-slate-100 p-5 rounded-3xl border border-slate-200/80 dark:border-[#273322] shadow-sm transition-colors"
        >
          <div className="border-r border-slate-100 dark:border-[#273322] pr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
            <span className="text-lg font-black text-[#134E2F] dark:text-[#C1F3BA]">
              {bpSys && bpDia ? `${bpSys}/${bpDia}` : '120/80'} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
            </span>
          </div>

          <div className="border-r border-slate-100 dark:border-[#273322] pr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Heart Rate</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {heartRate || '--'} <span className="text-[10px] font-normal text-slate-400">BPM</span>
            </span>
          </div>

          <div className="border-r border-slate-100 dark:border-[#273322] pr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Oxygen</span>
            <span className="text-lg font-black text-[#0A8E7A] dark:text-[#15E6CD]">
              {spo2 ? `${spo2}%` : '--'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Glucose</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {bloodGlucose ? `${bloodGlucose} mg/dL` : '--'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Health Score circular ring progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/90 dark:bg-[#151A12] backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm overflow-hidden relative h-full flex flex-col justify-between p-6 rounded-3xl transition-colors">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none text-[#134E2F] dark:text-[#C1F3BA]">
              <Activity className="h-40 w-40 -mr-10 -mt-10" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Health Score</p>
                {hasScore ? (
                  <h3 className="text-4xl font-black text-[#134E2F] dark:text-[#C1F3BA] mt-2">{score}<span className="text-lg font-light text-slate-400">/100</span></h3>
                ) : (
                  <h3 className="text-2xl font-bold mt-2 text-slate-800 dark:text-slate-100">Pending<span className="block text-xs font-normal text-slate-400">Log metrics</span></h3>
                )}
              </div>
              
              {/* Circular score ring */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="currentColor" className="text-slate-200 dark:text-[#273322]" strokeWidth="3" />
                  <circle 
                    cx="18" cy="18" r="15.91" 
                    fill="none" 
                    stroke="currentColor"
                    className="text-[#134E2F] dark:text-[#C1F3BA]"
                    strokeWidth="3.5" 
                    strokeDasharray={`${hasScore ? score : 0} 100`} 
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-[#134E2F] dark:text-[#C1F3BA]">{hasScore ? `${score}%` : '--'}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 bg-[#EAF8E7] dark:bg-[#1C2318] border border-[#C1F3BA] dark:border-[#273322] text-[#134E2F] dark:text-[#C1F3BA] px-3 py-1.5 rounded-xl w-fit text-xs font-bold">
              <ArrowUpRight className="h-4 w-4" />
              <span>Status: {scoreStatus}</span>
            </div>
          </Card>
        </motion.div>

        {/* Weight & BMI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/90 dark:bg-[#151A12] backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm h-full flex flex-col justify-between p-6 rounded-3xl transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weight & BMI</p>
                {weight ? (
                  <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{weight} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">kg</span></h3>
                ) : (
                  <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mt-2">Not specified</h3>
                )}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#C1F3BA]/40 text-[#134E2F] dark:text-[#C1F3BA] flex items-center justify-center font-bold">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">BMI: {bmi || '--'}</span>
              {bmiCategory && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C1F3BA]/40 text-[#134E2F] dark:text-[#C1F3BA] border border-[#C1F3BA]">
                  {bmiCategory}
                </span>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Water & Calories Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/90 dark:bg-[#151A12] backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm h-full flex flex-col justify-between p-6 rounded-3xl transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Water & Calories</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{waterCurrent > 0 ? `${waterCurrent.toFixed(1)}L` : '0.0L'}</span>
                    <span className="text-[10px] text-[#0A8E7A] dark:text-[#15E6CD] font-bold flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-[#15E6CD]" /> Water ({waterTarget.toFixed(1)}L)
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{caloriesBurned} kcal</span>
                    <span className="text-[10px] text-[#FF6554] font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Burned
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#273322] h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-[#134E2F] dark:bg-[#C1F3BA] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((waterCurrent / (waterTarget || 2.5)) * 100, 100)}%` }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Sleep & Exercise Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white/90 dark:bg-[#151A12] backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm h-full flex flex-col justify-between p-6 rounded-3xl transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sleep & Activity</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{sleepStr}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Moon className="w-3 h-3 text-[#134E2F] dark:text-[#C1F3BA]" /> Rest
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{exerciseMinutes}m</span>
                    <span className="text-[10px] text-[#0A8E7A] dark:text-[#15E6CD] font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Workout
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#C1F3BA]/40 text-[#134E2F] dark:text-[#C1F3BA] flex items-center justify-center shadow-sm">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#273322] h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-[#134E2F] dark:bg-[#C1F3BA] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((exerciseMinutes / 60) * 100, 100)}%` }}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Charts & Side Column */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Chart */}
        <div className="lg:col-span-4">
          <Card className="bg-white/80 dark:bg-[#151A12]/90 backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm h-full rounded-3xl overflow-hidden p-6 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-0 pt-0">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">Weekly Health Trends</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Progression metrics over the last 7 days.</CardDescription>
              </div>
              <select 
                value={chartMetric} 
                onChange={(e) => setChartMetric(e.target.value as any)}
                className="text-xs border border-slate-200 dark:border-[#273322] rounded-xl px-3 py-1.5 bg-white dark:bg-[#1C2318] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer transition-colors"
              >
                <option value="steps" className="bg-white dark:bg-[#151A12] text-slate-900 dark:text-slate-100">Steps</option>
                <option value="sleepHours" className="bg-white dark:bg-[#151A12] text-slate-900 dark:text-slate-100">Sleep Hours</option>
                <option value="waterIntake" className="bg-white dark:bg-[#151A12] text-slate-900 dark:text-slate-100">Water Intake</option>
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[260px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C1F3BA" stopOpacity={0.7}/>
                          <stop offset="95%" stopColor="#C1F3BA" stopOpacity={0.05}/>
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
                      <Area type="monotone" dataKey="value" stroke="#134E2F" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No trend metrics recorded for this week.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Reminders & Medication list */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Medication list */}
          <Card className="bg-white/80 dark:bg-[#151A12]/90 backdrop-blur-md border border-slate-200/80 dark:border-[#273322] shadow-sm rounded-3xl p-6 h-full flex flex-col justify-between transition-colors">
            <CardHeader className="pb-3 p-0">
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">Reminders & Medications</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4 flex-1 overflow-y-auto max-h-[260px]">
              <div className="space-y-3">
                {medications.length > 0 ? (
                  medications.map((med) => (
                    <div 
                      key={med.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-colors",
                        med.isActive 
                          ? "bg-white dark:bg-[#1C2318] border-slate-100 dark:border-[#273322] shadow-sm" 
                          : "bg-slate-50/50 dark:bg-[#1C2318]/40 border-slate-100/50 dark:border-[#273322]/50"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-xl", med.isActive ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40" : "bg-slate-200 dark:bg-slate-800")}>
                          <Pill className={cn("h-4 w-4", med.isActive ? "text-rose-500" : "text-slate-500")} />
                        </div>
                        <div>
                          <p className={cn("text-xs font-semibold", med.isActive ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through")}>{med.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {med.dosage || '1 dose'} • {med.time}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleReminder(med.id)}
                        className={cn(
                          "h-6 w-6 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                          med.isActive 
                            ? "border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800" 
                            : "bg-emerald-500 border-emerald-500 text-white"
                        )}
                      >
                        {!med.isActive ? <Check className="h-3 w-3" /> : null}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active medication reminders for today.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Log Modal Dialog */}
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Enter your daily activity and hydration stats.</p>

              <form onSubmit={handleSaveDailyMetric} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Steps Walked</label>
                  <Input 
                    type="number" 
                    value={logSteps} 
                    onChange={(e) => setLogSteps(e.target.value)} 
                    placeholder="e.g. 7400"
                    className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100"
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
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100"
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
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Calories Burned (kcal)</label>
                    <Input 
                      type="number" 
                      value={logCalories} 
                      onChange={(e) => setLogCalories(e.target.value)} 
                      placeholder="e.g. 400"
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Workout (Minutes)</label>
                    <Input 
                      type="number" 
                      value={logWorkout} 
                      onChange={(e) => setLogWorkout(e.target.value)} 
                      placeholder="e.g. 45"
                      className="bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-[#273322]">
                  <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSavingLog}
                    className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold rounded-2xl px-6 flex items-center gap-2 shadow-md shadow-[#134E2F]/20 cursor-pointer"
                  >
                    {isSavingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Metrics</span>
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

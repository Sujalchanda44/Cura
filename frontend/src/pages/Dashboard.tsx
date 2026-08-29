import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, Droplets, Flame, Moon, Activity, 
  Pill, Check, Loader2, Compass, Sparkles, 
  TrendingUp, Smile, CloudSun, Plus, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, healthProfile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [chartMetric, setChartMetric] = useState<'steps' | 'sleepHours' | 'waterIntake'>('steps');

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSteps, setLogSteps] = useState('5000');
  const [logWater, setLogWater] = useState('1500');
  const [logSleep, setLogSleep] = useState('7.5');
  const [logCalories, setLogCalories] = useState('350');
  const [logWorkout, setLogWorkout] = useState('30');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Motivational quote
  const [quote, setQuote] = useState('Your health is your greatest wealth. Small steps compound daily.');
  const quotesList = [
    'Your health is your greatest wealth. Small steps compound daily.',
    'Hydration fuels focus. Drink water consistently throughout the morning.',
    'Consistent sleep rhythms build mental clarity and physical resilience.',
    'A 30-minute walk balances cortisol and optimizes resting heart rates.',
    'Allergen Shield is active. Check food scanner results before new meals.'
  ];

  const fetchData = async () => {
    try {
      const [dashboard, profile, notifications] = await Promise.all([
        getHealthDashboard().catch(() => null),
        getUserProfile().catch(() => null),
        getNotifications().catch(() => [])
      ]);
      setDashboardData(dashboard);
      setProfileData(profile);
      setMedications((notifications || []).filter((n: any) => n.type === 'medicine'));
      setQuote(quotesList[Math.floor(Math.random() * quotesList.length)]);
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
        waterMl: Number(logWater),
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
    value: day[chartMetric] || 0
  }));

  const getMetricLabel = () => {
    if (chartMetric === 'steps') return 'Steps';
    if (chartMetric === 'sleepHours') return 'Sleep (Hours)';
    return 'Water (mL)';
  };

  return (
    <div className="space-y-8 p-1">
      {/* Animated Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 border border-slate-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-sm"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">{name}</span>.
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Here is your verified clinical AI wellness analysis for today.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsLogModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-xs font-bold rounded-2xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Today's Metrics</span>
          </Button>

          <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <CloudSun className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold block text-slate-700">72°F & Clear</span>
              <span className="text-slate-400">Cardio Weather</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Empty State Banner if no health data logged yet today */}
      {!hasLoggedToday && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No health metrics logged for today yet</h3>
              <p className="text-xs text-slate-500 mt-0.5">Log your water intake, steps, or sleep to generate your live clinical health score.</p>
            </div>
          </div>

          <Button 
            size="sm" 
            onClick={() => setIsLogModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            Quick Log Now
          </Button>
        </motion.div>
      )}

      {/* Motivational Quote Banner */}
      <div className="bg-slate-50/80 border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
        <Smile className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-medium text-slate-600 italic">{quote}</span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Health Score circular ring progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent overflow-hidden relative shadow-lg h-full flex flex-col justify-between p-6">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
              <Activity className="h-36 w-36 -mr-8 -mt-8" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Health Score</p>
                {hasScore ? (
                  <h3 className="text-4xl font-black mt-2">{score}<span className="text-lg font-light text-white/70">/100</span></h3>
                ) : (
                  <h3 className="text-2xl font-bold mt-2 text-white/90">Pending<span className="block text-xs font-normal text-white/70">Log metrics</span></h3>
                )}
              </div>
              
              {/* Circular score ring */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle 
                    cx="18" cy="18" r="15.91" 
                    fill="none" 
                    stroke="#FFFFFF" 
                    strokeWidth="3.5" 
                    strokeDasharray={`${hasScore ? score : 0} 100`} 
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-black">{hasScore ? `${score}%` : '--'}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl w-fit backdrop-blur-md text-xs font-semibold">
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
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm h-full flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weight & BMI</p>
                {weight ? (
                  <h3 className="text-3xl font-black text-slate-800 mt-2">{weight} <span className="text-sm font-normal text-slate-500">kg</span></h3>
                ) : (
                  <h3 className="text-lg font-bold text-slate-500 mt-2">Not specified</h3>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs font-semibold text-slate-600">BMI: {bmi || '--'}</span>
              {bmiCategory && (
                <Badge variant={bmiCategory === 'Normal' ? 'success' : 'warning'}>{bmiCategory}</Badge>
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
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm h-full flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Water & Calories</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-xl font-bold text-slate-800 block">{waterCurrent > 0 ? `${waterCurrent.toFixed(1)}L` : '0.0L'}</span>
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Water
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-800 block">{caloriesBurned} kcal</span>
                    <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Burned
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
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
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm h-full flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sleep & Activity</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-xl font-bold text-slate-800 block">{sleepStr}</span>
                    <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                      <Moon className="w-3 h-3" /> Rest
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-800 block">{exerciseMinutes}m</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Workout
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                <Moon className="h-5 w-5" />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((exerciseMinutes / 60) * 100, 100)}%` }}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/scanner')}
          className="p-5 bg-white border border-slate-200/80 hover:border-blue-300 shadow-sm rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold block text-slate-800 text-sm">OCR Food Scanner</span>
            <span className="text-xs text-slate-400">Scan barcodes & identify allergens</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/ai-assistant')}
          className="p-5 bg-white border border-slate-200/80 hover:border-purple-300 shadow-sm rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold block text-slate-800 text-sm">AI Health Assistant</span>
            <span className="text-xs text-slate-400">Personal wellness & clinical advice</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="p-5 bg-white border border-slate-200/80 hover:border-teal-300 shadow-sm rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold block text-slate-800 text-sm">Export Health PDFs</span>
            <span className="text-xs text-slate-400">Generate weekly clinical reports</span>
          </div>
        </button>
      </div>

      {/* Main Charts & Side Column */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Chart */}
        <div className="lg:col-span-4">
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm h-full rounded-3xl overflow-hidden p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-0 pt-0">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Weekly Health Trends</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Progression metrics over the last 7 days.</CardDescription>
              </div>
              <select 
                value={chartMetric} 
                onChange={(e) => setChartMetric(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="steps">Steps</option>
                <option value="sleepHours">Sleep Hours</option>
                <option value="waterIntake">Water Intake</option>
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[260px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip 
                        formatter={(val) => [val, getMetricLabel()]}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: '#FFFFFF' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
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

        {/* Sidebar Insights & Medication list */}
        <div className="space-y-6 lg:col-span-3 flex flex-col justify-between">
          {/* AI Insights glass panel */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10 shadow-sm rounded-3xl p-6">
            <CardHeader className="pb-3 p-0 flex flex-row items-center gap-3">
              <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-600 shadow-sm shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-extrabold text-slate-800">AI Medical Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                {hasLoggedToday
                  ? (score && score >= 80 
                      ? "Outstanding job! Your health metrics demonstrate excellent daily habits. Keeping up your water intake and exercise will solidify these gains." 
                      : "Your clinical metrics are recorded for today. Regular sleep schedules and hydration optimize cellular repair.")
                  : "Complete your health logging above to activate real-time predictive insights from your AI wellness coach."}
              </p>
            </CardContent>
          </Card>

          {/* Medication list */}
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-3xl p-6 flex-1 flex flex-col justify-between">
            <CardHeader className="pb-3 p-0">
              <CardTitle className="text-base font-extrabold text-slate-800">Reminders & Medications</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4 flex-1 overflow-y-auto max-h-[160px]">
              <div className="space-y-3">
                {medications.length > 0 ? (
                  medications.map((med) => (
                    <div 
                      key={med.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-colors",
                        med.isActive ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-slate-100/50"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-xl", med.isActive ? "bg-rose-50 border border-rose-100" : "bg-slate-200")}>
                          <Pill className={cn("h-4 w-4", med.isActive ? "text-rose-500" : "text-slate-500")} />
                        </div>
                        <div>
                          <p className={cn("text-xs font-semibold", med.isActive ? "text-slate-800" : "text-slate-400 line-through")}>{med.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {med.dosage || '1 dose'} • {med.time}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleReminder(med.id)}
                        className={cn(
                          "h-6 w-6 rounded-full border flex items-center justify-center transition-all",
                          med.isActive 
                            ? "border-slate-300 hover:border-blue-600 hover:bg-blue-50" 
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Log Today's Health Metrics</h2>
              <p className="text-xs text-slate-500 mb-6">Enter your daily activity and hydration stats.</p>

              <form onSubmit={handleSaveDailyMetric} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Steps Walked</label>
                  <Input 
                    type="number" 
                    value={logSteps} 
                    onChange={(e) => setLogSteps(e.target.value)} 
                    placeholder="e.g. 7400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Water (mL)</label>
                    <Input 
                      type="number" 
                      value={logWater} 
                      onChange={(e) => setLogWater(e.target.value)} 
                      placeholder="e.g. 2000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Sleep (Hours)</label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={logSleep} 
                      onChange={(e) => setLogSleep(e.target.value)} 
                      placeholder="e.g. 7.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Calories Burned (kcal)</label>
                    <Input 
                      type="number" 
                      value={logCalories} 
                      onChange={(e) => setLogCalories(e.target.value)} 
                      placeholder="e.g. 400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Workout (Minutes)</label>
                    <Input 
                      type="number" 
                      value={logWorkout} 
                      onChange={(e) => setLogWorkout(e.target.value)} 
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSavingLog}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
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

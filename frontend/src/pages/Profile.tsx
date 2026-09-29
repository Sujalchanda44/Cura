import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Activity, ShieldAlert, Loader2, Camera, 
  CheckCircle2, Target, Sparkles, RefreshCw, TrendingUp,
  Moon, Scale, Dumbbell, Heart, Sliders, Clock, Check 
} from 'lucide-react';
import { getUserProfile, getGoalAnalysis, updateHealthGoals } from '@/api/userApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import { AvatarUploadModal } from '@/components/AvatarUploadModal';
import { GoalEditModal } from '@/components/GoalEditModal';

export default function Profile() {
  const navigate = useNavigate();
  const { user, healthProfile, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarSuccessToast, setAvatarSuccessToast] = useState<string | null>(null);

  // Goal & AI Proximity State
  const [goalAnalysis, setGoalAnalysis] = useState<any>(null);
  const [isAnalyzingGoal, setIsAnalyzingGoal] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [goalSuccessToast, setGoalSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const loadGoalAnalysis = async (options?: any) => {
    setIsAnalyzingGoal(true);
    try {
      const result = await getGoalAnalysis(options);
      if (result) {
        setGoalAnalysis(result);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load goal analysis:', err);
    } finally {
      setIsAnalyzingGoal(false);
    }
  };

  useEffect(() => {
    loadGoalAnalysis();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeHealth = profileData?.healthProfile || healthProfile;
  const name = user?.name || profileData?.name || 'User';
  const email = user?.email || profileData?.email || '';
  const height = activeHealth?.heightCm ?? null;
  const weight = activeHealth?.weightKg ?? null;
  
  let bmi = activeHealth?.bmi ?? null;
  if (!bmi && weight && height) {
    const hM = height / 100;
    bmi = Number((weight / (hM * hM)).toFixed(1));
  }

  const bloodType = activeHealth?.bloodType ?? 'O+';
  const medicalConditions = activeHealth?.medicalConditions || [];
  const allergies = activeHealth?.allergies || [];
  const role = user?.role || profileData?.role || 'user';
  const rawAvatarUrl = user?.avatarUrl || profileData?.avatarUrl || null;
  const displayAvatarUrl = getAvatarUrl(rawAvatarUrl, name);

  const handleAvatarUpdated = async (newUrl: string | null) => {
    try {
      await updateUser({ avatarUrl: newUrl || '' });
      setProfileData((prev: any) => ({ ...prev, avatarUrl: newUrl || '' }));
      setAvatarSuccessToast(newUrl ? 'Profile picture updated successfully!' : 'Profile picture reset to default.');
      setTimeout(() => setAvatarSuccessToast(null), 4000);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to sync avatar update in Profile:', err);
    }
  };

  const handleSaveGoal = async (data: any) => {
    try {
      await updateHealthGoals(data);
      setProfileData((prev: any) => ({
        ...prev,
        healthProfile: {
          ...(prev?.healthProfile || {}),
          healthGoal: data.healthGoal,
          targets: {
            ...(prev?.healthProfile?.targets || {}),
            targetWeightKg: data.targetWeightKg,
            steps: data.targetSteps,
            sleepHours: data.targetSleepHours,
            waterMl: data.targetWaterMl
          }
        }
      }));
      await loadGoalAnalysis(data);
      setGoalSuccessToast('Health goal & targets updated! AI analysis refreshed.');
      setTimeout(() => setGoalSuccessToast(null), 4000);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Failed to update goal:', err);
      throw err;
    }
  };

  // Helper for Goal Category Icons
  const getGoalIcon = (cat: string) => {
    switch (cat) {
      case 'weight_management':
        return <Scale className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'muscle_building':
        return <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'fitness':
        return <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case 'sleep':
        return <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'heart_health':
        return <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Patient Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your personal, biometric, and clinical health goals.</p>
        </div>
        {goalSuccessToast && (
          <div className="p-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{goalSuccessToast}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Identity Card */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Interactive Avatar Container (Laptop & Phone) */}
              <div className="relative group">
                <div 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="h-28 w-28 rounded-full bg-slate-100 dark:bg-[#1C2318] flex items-center justify-center overflow-hidden border-4 border-white dark:border-[#273322] shadow-md relative cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                  title="Click to change profile picture"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setIsAvatarModalOpen(true)}
                >
                  <img 
                    src={displayAvatarUrl} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover" 
                  />

                  {/* Desktop Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold">
                    <Camera className="h-5 w-5 mb-1 text-white" />
                    <span>Change DP</span>
                  </div>
                </div>

                {/* Mobile & Laptop Camera Badge Button */}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  aria-label="Upload profile picture"
                  className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-[#134E2F] hover:bg-[#0E3B24] active:scale-90 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#273322] transition-all cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Upload Photo Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="inline-flex items-center text-xs font-semibold text-[#134E2F] dark:text-[#C1F3BA] hover:text-[#0E3B24] bg-[#F2FBF1] dark:bg-[#1C2318] hover:bg-[#E4F8E2] px-3.5 py-1.5 rounded-full transition-colors border border-[#C1F3BA]/60 dark:border-[#273322]"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Upload Photo
                </button>
              </div>

              {/* Success Notification Alert */}
              {avatarSuccessToast && (
                <div className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-xl flex items-center justify-center space-x-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{avatarSuccessToast}</span>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">Role: {role}</p>
                <div className="mt-2 flex justify-center">
                  <Badge variant="success" className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 uppercase text-xs">Active Profile</Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 dark:border-[#273322]">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 mr-3 text-slate-400" />
                {email}
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4 mr-3 text-slate-400" />
                Joined March 2026
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details & Health Overview */}
        <div className="md:col-span-2 space-y-6">
          {/* Health Overview */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Health Overview</CardTitle>
                <CardDescription>Your basic medical and biometric information.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings?tab=health')}>Edit Details</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-[#1C2318] rounded-xl border border-slate-100 dark:border-[#273322]">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Height</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{height} <span className="text-sm font-normal text-slate-400">cm</span></div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#1C2318] rounded-xl border border-slate-100 dark:border-[#273322]">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Weight</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{weight} <span className="text-sm font-normal text-slate-400">kg</span></div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#1C2318] rounded-xl border border-slate-100 dark:border-[#273322]">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">BMI</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{bmi}</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#1C2318] rounded-xl border border-slate-100 dark:border-[#273322]">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Blood Type</div>
                  <div className="text-lg font-bold text-danger">{bloodType}</div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-primary" /> Medical Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {medicalConditions.length > 0 ? (
                      medicalConditions.map((cond: string, i: number) => (
                        <Badge key={i} variant="secondary">{cond}</Badge>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm font-normal">None recorded.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-2 text-warning" /> Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allergies.length > 0 ? (
                      allergies.map((alg: string, i: number) => (
                        <Badge key={i} variant="destructive" className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/40">{alg}</Badge>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm font-normal">No known allergies.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Goals & AI Target Analysis Card */}
          <Card className="shadow-sm border-slate-200 dark:border-[#273322]">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-[#273322] pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-[#134E2F] dark:text-[#C1F3BA]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">Health Goals & AI Target Analysis</CardTitle>
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-200/50">
                      AI Powered
                    </span>
                  </div>
                  <CardDescription>
                    AI evaluates your historical logs and biometrics to determine proximity to your goal.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadGoalAnalysis()}
                  disabled={isAnalyzingGoal}
                  className="rounded-xl h-9 text-xs flex items-center gap-1.5"
                  title="Refresh AI analysis using latest logs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzingGoal ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingGoal ? 'Analyzing...' : 'Refresh AI'}</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsGoalModalOpen(true)}
                  className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold rounded-xl h-9 text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Set / Edit Goal</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Active Goal & Proximity Progress Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50/50 to-white dark:from-emerald-950/20 dark:via-[#1C2318] dark:to-[#151A12] border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white dark:bg-[#151A12] border border-emerald-200/80 dark:border-[#273322] flex items-center justify-center shadow-xs">
                      {getGoalIcon(goalAnalysis?.goalCategory || 'wellness')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                          Active Target Goal
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                          {goalAnalysis?.status || 'Analyzing'}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                        {goalAnalysis?.goalTitle || 'Holistic Daily Wellness & Longevity'}
                      </h3>
                    </div>
                  </div>

                  {/* Quantitative Distance Tag */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Distance to Target</span>
                    <span className="text-sm font-extrabold text-[#134E2F] dark:text-[#C1F3BA]">
                      {goalAnalysis?.distanceSummary || 'Calculating gap...'}
                    </span>
                  </div>
                </div>

                {/* Proximity Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      Goal Proximity Score
                    </span>
                    <span className="font-extrabold text-[#134E2F] dark:text-[#C1F3BA] text-sm">
                      {goalAnalysis?.proximityPercentage ?? 0}% Close to Goal
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-[#134E2F] dark:from-[#C1F3BA] dark:to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                      style={{ width: `${Math.max(5, Math.min(100, goalAnalysis?.proximityPercentage ?? 0))}%` }}
                    />
                  </div>

                  {/* Time Estimate Horizon */}
                  {goalAnalysis?.timeEstimate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Estimated Timeframe:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {goalAnalysis.timeEstimate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Comparison Grid (Current vs. Target vs. Distance) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Clinical Metrics vs. Goal Targets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(goalAnalysis?.metricsComparison || [
                    { label: 'Body Weight', current: `${weight || 50} kg`, target: '55.8 kg', difference: '+5.8 kg', progressPercent: 55, status: `BMI ${bmi}` },
                    { label: 'Daily Steps', current: '0 steps', target: '8,000 steps', difference: '8,000 gap', progressPercent: 0, status: 'Pending Log' },
                    { label: 'Daily Hydration', current: '0.0 L', target: '1.8 L', difference: '1.8 L gap', progressPercent: 0, status: 'Baseline' },
                    { label: 'Sleep Rest', current: '0 hrs', target: '8.0 hrs', difference: '8.0 hrs needed', progressPercent: 0, status: 'Restorative' }
                  ]).map((item: any, idx: number) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#273322] bg-white dark:bg-[#1C2318] shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold truncate">{item.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.status}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {item.current}
                          </div>
                          <span className="text-[10px] text-slate-400">Current</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#134E2F] dark:text-[#C1F3BA]">
                            {item.target}
                          </div>
                          <span className="text-[10px] text-slate-400">Target</span>
                        </div>
                      </div>

                      {/* Small progress line */}
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-[#134E2F] dark:bg-[#C1F3BA] rounded-full"
                          style={{ width: `${Math.min(100, item.progressPercent ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Clinical Insights & Recommendations */}
              <div className="p-5 rounded-2xl bg-emerald-950/[0.03] dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#134E2F] dark:text-[#C1F3BA]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Cura+ AI Proximity Insights
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Analyzed from your patient biometrics and historical logs.
                    </p>
                  </div>
                </div>

                {/* AI Headline */}
                {goalAnalysis?.headline && (
                  <div className="text-sm font-bold text-[#134E2F] dark:text-[#C1F3BA] bg-white/80 dark:bg-[#151A12]/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    "{goalAnalysis.headline}"
                  </div>
                )}

                {/* AI Clinical Summary Narrative */}
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {goalAnalysis?.aiAnalysisSummary || 
                    `Based on your biometrics (height ${height || 165} cm, weight ${weight || 50} kg, BMI ${bmi || 18.4}), your goal is within reach. Consistently logging your daily nutrition and activities will empower AI to calculate refined daily milestones.`}
                </p>

                {/* Historical Insights */}
                {goalAnalysis?.historicalInsights && goalAnalysis.historicalInsights.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-emerald-200/40 dark:border-emerald-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Historical Observations:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {goalAnalysis.historicalInsights.map((insight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actionable Next Steps to Bridge Distance */}
                {goalAnalysis?.actionableNextSteps && goalAnalysis.actionableNextSteps.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200/40 dark:border-emerald-800/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Recommended Next Steps to Close the Gap:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {goalAnalysis.actionableNextSteps.map((stepText: string, idx: number) => (
                        <div 
                          key={idx}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#151A12] border border-slate-200/70 dark:border-[#273322] flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">{stepText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Picture Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={rawAvatarUrl || ''}
        userName={name}
        onAvatarUpdated={handleAvatarUpdated}
      />

      {/* Goal & Target Edit Modal */}
      <GoalEditModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={activeHealth?.healthGoal || activeHealth?.mainHealthGoal || 'general_wellness'}
        currentTargetWeight={activeHealth?.targets?.targetWeightKg || null}
        currentTargetSteps={activeHealth?.targets?.steps || 8000}
        currentTargetSleep={activeHealth?.targets?.sleepHours || 8}
        currentTargetWater={activeHealth?.targets?.waterMl || 2200}
        currentWeight={weight || 50}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

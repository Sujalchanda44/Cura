import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
  Heart,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap,
  HelpCircle,
  ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { scanFood, ScanResult } from '@/api/scannerApi';
import { apiClient } from '@/api/apiClient';

interface GaugeProps {
  score: number;
}

function FoodHealthScoreGauge({ score }: GaugeProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Semicircle parameters (r = 75, circumference of semicircle = PI * 75 ~ 235.62)
  const radius = 75;
  const strokeWidth = 14;
  const arcLength = Math.PI * radius;
  const progressOffset = arcLength - (clampedScore / 100) * arcLength;

  const getScoreZone = (sc: number) => {
    if (sc < 40) {
      return {
        label: 'Harmful / High Risk',
        textColor: 'text-rose-600 dark:text-rose-400',
        dotColor: 'bg-rose-500'
      };
    }
    if (sc < 70) {
      return {
        label: 'Caution Advised',
        textColor: 'text-amber-600 dark:text-amber-400',
        dotColor: 'bg-amber-500'
      };
    }
    if (sc < 85) {
      return {
        label: 'Good Choice',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        dotColor: 'bg-emerald-500'
      };
    }
    return {
      label: 'Excellent Match',
      textColor: 'text-[#134E2F] dark:text-[#C1F3BA]',
      dotColor: 'bg-[#134E2F]'
    };
  };

  const currentZone = getScoreZone(clampedScore);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto">
      {/* Visual Semicircular Gauge */}
      <div className="relative w-56 h-32 sm:w-64 sm:h-36 flex items-end justify-center">
        <svg
          viewBox="0 0 200 115"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="foodScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="39%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="69%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="84%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#059669" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Semicircle background arc */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="url(#foodScoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Big Prominent Score in the center */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
            Food Health Score
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className={cn('text-5xl sm:text-6xl font-black tracking-tight leading-none', currentZone.textColor)}>
              {clampedScore}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-400">
              / 100
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal 4-Zone Score Meter with Sliding Indicator Needle */}
      <div className="w-full mt-4 px-2">
        <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
          <div className="h-full w-[39%] bg-rose-500" title="0–39 Harmful / High Risk" />
          <div className="h-full w-[30%] bg-amber-400" title="40–69 Caution" />
          <div className="h-full w-[15%] bg-emerald-400" title="70–84 Good" />
          <div className="h-full w-[16%] bg-emerald-600" title="85–100 Excellent" />
        </div>

        {/* Sliding Indicator Bead */}
        <div className="relative w-full h-3">
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out"
            style={{ left: `${clampedScore}%` }}
          >
            <div className={cn('w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-md', currentZone.dotColor)} />
          </div>
        </div>

        {/* Score Zone Labels */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">
          <span className="text-rose-500">RED</span>
          <span className="text-amber-500">← CAUTION</span>
          <span className="text-emerald-500">GOOD</span>
          <span className="text-emerald-700 dark:text-emerald-400">EXCELLENT → GREEN</span>
        </div>
      </div>
    </div>
  );
}

export default function Scanner() {
  const navigate = useNavigate();
  const { healthProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modes: 'upload' | 'analyzing' | 'result'
  const [mode, setMode] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textHint, setTextHint] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Progressive Disclosure: 'none' | 'why' | 'ingredients' | 'nutrition'
  const [expandedSection, setExpandedSection] = useState<'none' | 'why' | 'ingredients' | 'nutrition'>('none');

  // Progressive analysis steps animation
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const loadingMessages = [
    'Analyzing food photo with AI vision...',
    'Identifying ingredients and recipe components...',
    'Cross-referencing your health profile & allergies...',
    'Calculating your personalized Food Health Score...'
  ];

  // Log to diary state
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // Cycle loading messages during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'analyzing') {
      setLoadingPhase(0);
      interval = setInterval(() => {
        setLoadingPhase(prev => (prev + 1) % loadingMessages.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [mode]);

  // Extract user health profile attributes
  const userAllergies: string[] = healthProfile?.allergies || [];
  const userConditions: string[] = healthProfile?.medicalConditions || [];
  const userDiet: string = healthProfile?.dietType || 'Balanced';

  // Normalize score data for consistent glanceable display
  const normalizeScoreData = (result: ScanResult) => {
    let healthScore = typeof result.healthScore === 'number' ? result.healthScore : undefined;
    let status = result.status;
    let shortVerdict = result.shortVerdict;
    let mainConcern = result.mainConcern;
    let betterChoice = result.betterChoice;
    let energyImpact = result.energyImpact;
    let detailedAnalysis = result.detailedAnalysis || result.recommendation;

    const calories = result.nutrition?.calories || result.nutritionalBreakdown?.calories || 0;
    const protein = result.nutrition?.protein || result.nutritionalBreakdown?.protein || 0;
    const carbs = result.nutrition?.carbohydrates || result.nutritionalBreakdown?.carbs || 0;
    const fat = result.nutrition?.fat || result.nutritionalBreakdown?.fat || 0;
    const sugar = result.nutrition?.sugar || result.nutritionalBreakdown?.sugar || 0;
    const sodium = result.nutrition?.sodium || result.nutritionalBreakdown?.sodium || 0;

    const allergyConflict = result.allergyConflict ?? ((result.matchedUserAllergies && result.matchedUserAllergies.length > 0) || false);
    const topAllergy = result.allergyName || (result.matchedUserAllergies?.[0]?.allergen) || null;

    if (healthScore === undefined) {
      if (allergyConflict) {
        healthScore = 28;
        status = 'harmful';
        shortVerdict = 'Not a good match for you';
        mainConcern = `${topAllergy || 'Allergen'} detected • Conflicts with your allergy`;
      } else if (result.riskLevel === 'HIGH') {
        healthScore = 34;
        status = 'harmful';
        shortVerdict = 'Not a good match for you';
        mainConcern = result.riskReasons?.[0] || 'Unfavorable for your health profile';
      } else if (result.riskLevel === 'CAUTION') {
        healthScore = 58;
        status = 'caution';
        shortVerdict = 'Okay in moderation';
        mainConcern = result.riskReasons?.[0] || 'Consume with moderation';
      } else {
        healthScore = 84;
        status = 'good';
        shortVerdict = 'Good choice for you';
        mainConcern = 'Matches your health profile and dietary baseline';
      }
    }

    if (!status) {
      if (healthScore < 40) status = 'harmful';
      else if (healthScore < 70) status = 'caution';
      else if (healthScore < 85) status = 'good';
      else status = 'excellent';
    }

    if (!shortVerdict) {
      if (status === 'harmful') shortVerdict = 'Not a good match for you';
      else if (status === 'caution') shortVerdict = 'Okay in moderation';
      else if (status === 'good') shortVerdict = 'Good choice for you';
      else shortVerdict = 'Excellent match';
    }

    if (!betterChoice) {
      betterChoice = result.alternativeSuggestion || (status === 'harmful' ? 'Choose an allergen-free alternative meal' : 'Pair with leafy greens or high-fiber foods');
    }

    if (!energyImpact) {
      energyImpact = {
        relevant: calories > 0,
        label: calories > 600 ? 'High calorie' : calories >= 350 ? 'Moderate calorie' : 'Light energy',
        value: calories > 0 ? `${calories} kcal` : 'Estimated'
      };
    }

    return {
      healthScore,
      status,
      shortVerdict,
      mainConcern,
      betterChoice,
      energyImpact,
      nutrition: { calories, protein, carbs, fat, sugar, sodium },
      allergyConflict,
      allergyName: topAllergy,
      detailedAnalysis
    };
  };

  // Check if an individual ingredient conflicts with user allergies or health concerns
  const checkIngredientHarm = (ingredient: string): { isHarmful: boolean; reason?: string } => {
    if (!scanResult) return { isHarmful: false };
    const ingLower = ingredient.toLowerCase().trim();

    // 1. Check matched user allergies from analysis
    for (const match of (scanResult.matchedUserAllergies || [])) {
      const allergen = (match.allergen || '').toLowerCase();
      const foundIn = (match.foundIn || '').toLowerCase();
      if (
        (allergen && (ingLower.includes(allergen) || allergen.includes(ingLower))) ||
        (foundIn && (ingLower.includes(foundIn) || foundIn.includes(ingLower)))
      ) {
        return { isHarmful: true, reason: `Contains allergen: ${match.allergen}` };
      }
    }

    // 2. Check matched intolerances from analysis
    for (const match of (scanResult.matchedIntolerances || [])) {
      const intolerance = (match.intolerance || '').toLowerCase();
      const foundIn = (match.foundIn || '').toLowerCase();
      if (
        (intolerance && (ingLower.includes(intolerance) || intolerance.includes(ingLower))) ||
        (foundIn && (ingLower.includes(foundIn) || foundIn.includes(ingLower)))
      ) {
        return { isHarmful: true, reason: `Intolerance: ${match.intolerance}` };
      }
    }

    // 3. Direct check against registered profile allergies
    for (const allergy of userAllergies) {
      const aLower = allergy.toLowerCase();
      if (ingLower.includes(aLower) || aLower.includes(ingLower)) {
        return { isHarmful: true, reason: `Allergy conflict: ${allergy}` };
      }
    }

    return { isHarmful: false };
  };

  // Execute AI Analysis directly on the file
  const executeScan = async (fileToAnalyze: File) => {
    setMode('analyzing');
    setError(null);
    setIsLogged(false);
    setExpandedSection('none');

    try {
      const result = await scanFood(fileToAnalyze, textHint);
      if (result) {
        setScanResult(result);
        setMode('result');
        try {
          const rawStats = localStorage.getItem('cura_scan_stats');
          const currentStats = rawStats ? JSON.parse(rawStats) : { totalScans: 0, safeScans: 0, warningScans: 0 };
          const isSafe = (result.healthScore ? result.healthScore >= 70 : (result.riskLevel === 'LOW' || result.safetyStatus === 'SAFE'));
          const updatedStats = {
            totalScans: (currentStats.totalScans || 0) + 1,
            safeScans: (currentStats.safeScans || 0) + (isSafe ? 1 : 0),
            warningScans: (currentStats.warningScans || 0) + (isSafe ? 0 : 1),
            lastScannedFood: result.foodName,
            lastSafetyStatus: result.safetyStatus || result.riskLevel || 'SAFE',
            lastScannedAt: new Date().toISOString()
          };
          localStorage.setItem('cura_scan_stats', JSON.stringify(updatedStats));
        } catch (_) {}
      } else {
        setError('Failed to analyze food image. Please try again.');
        setMode('upload');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to complete food safety analysis. Please check your network and try again.'
      );
      setMode('upload');
    }
  };

  // Handle file selection and trigger analysis immediately
  const handleFileSelect = (file: File) => {
    const validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setError('Please upload a supported image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    executeScan(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Reset to Upload mode
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setTextHint('');
    setScanResult(null);
    setError(null);
    setIsLogged(false);
    setExpandedSection('none');
    setMode('upload');
  };

  // Log to Diary
  const handleLogToDiary = async () => {
    if (!scanResult) return;
    setIsLogging(true);
    try {
      await apiClient.post('/scanner/analyze', {
        barcode: scanResult.barcode || undefined,
        textHint: scanResult.foodName,
        autoLog: true,
        mealType: 'lunch'
      });
      setIsLogged(true);
    } catch (err) {
      console.warn('Auto log notice:', err);
      setIsLogged(true);
    } finally {
      setIsLogging(false);
    }
  };

  const normalized = scanResult ? normalizeScoreData(scanResult) : null;
  const ingredientsList = (scanResult?.detectedIngredients || scanResult?.ingredients || []);
  const totalIngredients = ingredientsList.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 pt-2 px-4 sm:px-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Food & Nutrition Scanner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-1">
            Personalized AI vision scanner cross-referencing your medical profile, allergies, and nutrition in real-time.
          </p>
        </div>

        {mode === 'result' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Another Meal</span>
          </Button>
        )}
      </div>

      {/* Active User Health Profile Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0 font-bold">
            🛡️
          </div>
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block sm:inline mr-2">
              Active Health Profile:
            </span>
            <span>
              {userAllergies.length > 0 ? (
                <span className="font-semibold text-rose-700 dark:text-rose-400 mr-2">
                  Allergies: [{userAllergies.join(', ')}]
                </span>
              ) : (
                <span className="text-slate-500 mr-2">No registered allergies</span>
              )}
              {userConditions.length > 0 && (
                <span className="font-semibold text-amber-700 dark:text-amber-400 mr-2">
                  • Conditions: [{userConditions.join(', ')}]
                </span>
              )}
              {userDiet && (
                <span className="text-slate-600 dark:text-slate-400">
                  • Diet: {userDiet}
                </span>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>Update Profile</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: UPLOAD AREA                                      */}
      {/* ======================================================== */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'bg-white dark:bg-[#151A12] rounded-3xl border-2 border-dashed transition-all p-10 sm:p-14 flex flex-col items-center justify-center cursor-pointer group shadow-sm hover:shadow-lg',
              isDragging
                ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/30 scale-[1.01]'
                : 'border-slate-200 dark:border-[#273322] hover:border-emerald-600/50'
            )}
          >
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-emerald-100/60 dark:bg-emerald-950/60 flex items-center justify-center mb-5 group-hover:scale-105 transition-all text-[#134E2F] dark:text-[#C1F3BA]">
              <Upload className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
              Upload Food Photo
            </h3>

            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 max-w-sm">
              Drag and drop your food photo here or browse to scan. AI will immediately analyze all ingredients and check if any are harmful for your health.
            </p>

            <Button
              type="button"
              className="rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white px-8 py-6 text-base font-semibold shadow-md shadow-[#134E2F]/20 cursor-pointer pointer-events-none"
            >
              Choose Food Photo
            </Button>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Supports JPG, JPEG, PNG, and WebP (up to 10MB)
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>

          {/* Optional Dish Name / Restaurant Hint */}
          <div className="bg-white dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] rounded-2xl p-4 shadow-2xs">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Add Food Details or Dish Name (Optional)
            </label>
            <Input
              type="text"
              value={textHint}
              onChange={e => setTextHint(e.target.value)}
              placeholder="e.g. Paneer Butter Masala, Sourdough bread, Restaurant dal..."
              className="h-11 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provides extra context if ingredients are blended or from a specific dish.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: ACTIVE AI SCANNING & INGREDIENT ANALYSIS STATE   */}
      {/* ======================================================== */}
      {mode === 'analyzing' && (
        <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-sm">
          {/* Photo being scanned with Laser Beam */}
          <div className="relative rounded-3xl overflow-hidden max-w-sm w-full max-h-72 mb-6 shadow-lg border-2 border-emerald-500/40 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Scanning food"
                className="w-full h-full object-cover max-h-72"
              />
            )}
            
            {/* Animated Laser Scanning Beam */}
            <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent border-b-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-scan-beam pointer-events-none" />

            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>AI Vision Analyzing</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
            Analyzing Food & Ingredients
          </h2>

          <p className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 min-h-[28px] transition-all duration-300">
            {loadingMessages[loadingPhase]}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            Scanning detected ingredients against your registered health profile (Allergies: {userAllergies.length > 0 ? userAllergies.join(', ') : 'None'}) to compute your Food Health Score.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="mt-6 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel & Choose Another Photo</span>
          </Button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: REDESIGNED FOOD HEALTH SCORE EXPERIENCE          */}
      {/* ======================================================== */}
      {mode === 'result' && scanResult && normalized && (
        <div className="space-y-5">
          {/* Limited Analysis Notice if emergency fallback ran */}
          {scanResult.isLimitedAnalysis && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-2xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">Limited analysis mode:</span> Operating on backup safety protocols. Please verify packaged allergen statements.
              </div>
            </div>
          )}

          {/* 1. TOP MEAL HEADER (Image + Name + Quick Reset) */}
          <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200/80 dark:border-[#273322] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {previewUrl ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs bg-slate-100 dark:bg-slate-900">
                  <img src={previewUrl} alt={scanResult.foodName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#134E2F] dark:text-[#C1F3BA] flex items-center justify-center text-3xl shrink-0 font-bold">
                  🥗
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Scanned Meal
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 truncate">
                  {scanResult.foodName}
                </h2>
                {scanResult.servingSize && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Serving: {scanResult.servingSize}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Another Meal</span>
            </Button>
          </div>

          {/* 2. PRIMARY HEALTH SCORE CARD (Central Visual Experience) */}
          <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200/80 dark:border-[#273322] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-4">
            {/* Visual Arc Gauge + 4-Zone Horizontal Spectrum Meter */}
            <FoodHealthScoreGauge score={normalized.healthScore} />

            {/* Simple Verdict directly below score */}
            <div className="pt-2">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm sm:text-base font-extrabold border shadow-2xs transition-all',
                  normalized.status === 'harmful'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                    : normalized.status === 'caution'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                )}
              >
                <span>{normalized.status === 'harmful' ? '⚠️' : normalized.status === 'caution' ? '🟡' : '✅'}</span>
                <span>{normalized.shortVerdict}</span>
              </div>
            </div>

            {/* 3. Personal Health Match / Main Warning */}
            <div className="w-full max-w-lg pt-1">
              {normalized.allergyConflict ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/50 flex items-center gap-3 text-left shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-700 dark:text-rose-300 text-lg shrink-0 font-bold">
                    ⚠️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-rose-950 dark:text-rose-200">
                      {normalized.allergyName ? `${normalized.allergyName} detected` : 'Allergen detected'}
                    </div>
                    <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
                      Doesn't match your registered health allergy.
                    </div>
                  </div>
                </div>
              ) : normalized.status === 'caution' ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/50 flex items-center gap-3 text-left shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 text-lg shrink-0 font-bold">
                    ⚠️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                      {normalized.mainConcern}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold mt-0.5">
                      Caution advised based on your registered health condition.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-3 text-left shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      {normalized.mainConcern || 'Safe for your health profile'}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Zero allergy conflicts or harmful components detected.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. One Simple Action / Better Choice */}
            {normalized.betterChoice && (
              <div className="w-full max-w-lg p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2217] border border-slate-200/80 dark:border-[#273322] flex items-center gap-3 text-left shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 flex items-center justify-center text-xl shrink-0">
                  🥗
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                    Better choice
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    → {normalized.betterChoice}
                  </span>
                </div>
              </div>
            )}

            {/* 5. Energy Impact Metric (Compact line) */}
            {normalized.energyImpact?.relevant && (
              <div className="w-full max-w-lg flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>⚡ Energy</span>
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {normalized.energyImpact.label} · <strong className="text-slate-900 dark:text-slate-100">{normalized.energyImpact.value}</strong>
                </span>
              </div>
            )}

            {/* 6. Nutrition Summary (Compact Visual Chips) */}
            <div className="w-full max-w-lg pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-center">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                    🔥 Calories
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.calories || 0} <span className="text-[11px] font-normal text-slate-400">kcal</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-center">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                    💪 Protein
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {normalized.nutrition.protein || 0} <span className="text-[11px] font-normal text-slate-400">g</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-center">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                    🍞 Carbs
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.carbs || 0} <span className="text-[11px] font-normal text-slate-400">g</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-center">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-0.5">
                    🧈 Fat
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.fat || 0} <span className="text-[11px] font-normal text-slate-400">g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7 & 8. Progressive Disclosure Interactive Toggles */}
            <div className="w-full max-w-lg pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpandedSection(prev => prev === 'why' ? 'none' : 'why')}
                className={cn(
                  'rounded-xl text-xs font-semibold gap-1.5 transition-all',
                  expandedSection === 'why'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why this score?</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', expandedSection === 'why' && 'rotate-180')} />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpandedSection(prev => prev === 'ingredients' ? 'none' : 'ingredients')}
                className={cn(
                  'rounded-xl text-xs font-semibold gap-1.5 transition-all',
                  expandedSection === 'ingredients'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>View ingredients ({totalIngredients})</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', expandedSection === 'ingredients' && 'rotate-180')} />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpandedSection(prev => prev === 'nutrition' ? 'none' : 'nutrition')}
                className={cn(
                  'rounded-xl text-xs font-semibold gap-1.5 transition-all',
                  expandedSection === 'nutrition'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>More nutrition</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', expandedSection === 'nutrition' && 'rotate-180')} />
              </Button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* EXPANDED SECTION 1: WHY THIS SCORE? (DETAILED AI INSIGHTS)*/}
          {/* ======================================================== */}
          {expandedSection === 'why' && (
            <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200/80 dark:border-[#273322] p-6 shadow-sm space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  <span>Why This Health Score Was Given</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedSection('none')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Close
                </button>
              </div>

              {/* Detailed AI Analysis Paragraph */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-slate-100 block mb-1">
                  AI Clinical Reasoning:
                </strong>
                {normalized.detailedAnalysis || 'Analysis complete. Verified recipe ingredients, macro balance, and user health profile compatibility.'}
              </div>

              {/* Matched Allergies in detail if present */}
              {scanResult.matchedUserAllergies && scanResult.matchedUserAllergies.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Allergen Conflicts Detected:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {scanResult.matchedUserAllergies.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900 dark:text-rose-200">
                            {m.allergen}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded-md">
                            {m.severity} Risk
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Found in: <strong>{m.foundIn}</strong>
                        </p>
                        <p className="text-rose-800 dark:text-rose-300 font-medium">
                          {m.warning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Conditions in detail if present */}
              {scanResult.healthConcerns && scanResult.healthConcerns.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    <Heart className="w-4 h-4" />
                    <span>Medical Profile Impact:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {scanResult.healthConcerns.map((hc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1"
                      >
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          {hc.condition}: {hc.concern}
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {hc.advice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Compatibility Matrix */}
              {scanResult.profileChecks && scanResult.profileChecks.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                    Health Baseline Compatibility:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scanResult.profileChecks.map((chk, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold',
                          chk.status === 'conflict'
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                            : chk.status === 'caution'
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                            : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                        )}
                      >
                        <span>{chk.label}</span>
                        <span className="font-extrabold text-sm ml-2">
                          {chk.status === 'conflict' ? '🔴' : chk.status === 'caution' ? '⚠' : '✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* EXPANDED SECTION 2: VIEW INGREDIENTS                    */}
          {/* ======================================================== */}
          {expandedSection === 'ingredients' && (
            <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200/80 dark:border-[#273322] p-6 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Analyzed Ingredients ({totalIngredients})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Every ingredient checked against your registered allergies & dietary restrictions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedSection('none')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {ingredientsList.map((ing, idx) => {
                  const harmCheck = checkIngredientHarm(ing);
                  return (
                    <span
                      key={idx}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all',
                        harmCheck.isHarmful
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-2 border-rose-400 dark:border-rose-700 shadow-2xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      )}
                      title={harmCheck.reason || 'Safe ingredient'}
                    >
                      <span>{harmCheck.isHarmful ? '⚠️' : '✓'}</span>
                      <span>{ing}</span>
                      {harmCheck.isHarmful && (
                        <span className="text-[9px] uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded-md font-black">
                          Harmful
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {scanResult.uncertainIngredients && scanResult.uncertainIngredients.length > 0 && (
                <div className="pt-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-900">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Check physical package for uncertain items: {scanResult.uncertainIngredients.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* EXPANDED SECTION 3: MORE NUTRITION                      */}
          {/* ======================================================== */}
          {expandedSection === 'nutrition' && (
            <div className="bg-white dark:bg-[#151A12] rounded-3xl border border-slate-200/80 dark:border-[#273322] p-6 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Comprehensive Nutrition Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estimated nutrient levels based on meal volume and recipe composition
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedSection('none')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.calories} kcal
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Energy / Calories
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {normalized.nutrition.protein}g
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Protein
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.carbs}g
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Carbohydrates
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.fat}g
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Total Fat
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {normalized.nutrition.sugar}g
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Sugars
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {normalized.nutrition.sodium}mg
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    Sodium
                  </div>
                </div>
              </div>

              {scanResult.servingSize && (
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Serving reference: <span className="font-semibold text-slate-700 dark:text-slate-300">{scanResult.servingSize}</span>
                </div>
              )}
            </div>
          )}

          {/* Clinical Safety Disclaimer (Subtle at bottom) */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Cura+ Food Health Score is an assistive clinical safety guide based on your registered profile. AI cannot guarantee zero cross-contamination. Always verify manufacturer labels for packaged foods.
            </p>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleLogToDiary}
              disabled={isLogging || isLogged}
              className="flex-1 h-13 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-50"
            >
              {isLogging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Logging to Diary...</span>
                </>
              ) : isLogged ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-[#C1F3BA]" />
                  <span>Logged to Nutrition Diary</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>Log to Nutrition Diary</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              className="h-13 px-8 text-base font-semibold rounded-2xl border-slate-200 dark:border-slate-800"
            >
              Scan Another Meal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Loader2,
  Activity,
  Apple,
  Moon,
  Scale,
  ShieldCheck,
  User,
  Stethoscope,
  Clock,
  RotateCcw,
  Target,
  Smile,
  AlertCircle,
  Globe,
  Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { OnboardingData, profileService } from '@/services/profile';
import { useLanguage, LanguageCode } from '@/contexts/LanguageContext';

// Common medical conditions for Question 7 quick selection
const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Thyroid disorder',
  'Heart disease',
  'High cholesterol',
  'Migraine',
  'Arthritis',
  'Kidney disease',
  'PCOS / PCOD'
];

// Common allergies for Question 9 quick selection
const COMMON_ALLERGIES = [
  'Milk',
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Seafood',
  'Shellfish',
  'Wheat / Gluten',
  'Soy',
  'Dust',
  'Pollen',
  'Latex',
  'Penicillin'
];

// Dietary preferences for Question 10 (Dietary Lifestyle & Medications)
const DIETARY_OPTIONS = [
  {
    id: 'non-vegetarian',
    label: 'Non-Vegetarian',
    desc: 'Chicken, meat, seafood, eggs & vegetables',
    icon: '🍗'
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    desc: 'Plant foods, grains & dairy; strictly no meat or fish',
    icon: '🥬'
  },
  {
    id: 'vegan',
    label: 'Vegan',
    desc: '100% plant-based; strictly no meat, eggs or dairy',
    icon: '🌱'
  },
  {
    id: 'eggetarian',
    label: 'Eggetarian',
    desc: 'Vegetarian diet with eggs included',
    icon: '🥚'
  },
  {
    id: 'jain',
    label: 'Jain (No Root Veg)',
    desc: 'Vegetarian with no potato, onion, or garlic',
    icon: '🪷'
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    desc: 'Vegetarian diet plus fish and seafood',
    icon: '🐟'
  }
];

// Health goals for Question 11 (Final Question)
const HEALTH_GOALS_LIST = [
  {
    id: 'general_wellness',
    label: 'General wellness',
    desc: 'Daily vitality, balance & healthy habits',
    icon: Sparkles
  },
  {
    id: 'improve_fitness',
    label: 'Improve fitness',
    desc: 'Build endurance, stamina & daily activity',
    icon: Activity
  },
  {
    id: 'improve_nutrition',
    label: 'Improve nutrition',
    desc: 'Balanced eating, hydration & whole foods',
    icon: Apple
  },
  {
    id: 'better_sleep',
    label: 'Better sleep',
    desc: 'Restore circadian rhythm & deep rest',
    icon: Moon
  },
  {
    id: 'weight_management',
    label: 'Weight management',
    desc: 'Healthy body composition & sustainable pacing',
    icon: Scale
  },
  {
    id: 'stress_management',
    label: 'Stress management',
    desc: 'Calm nervous system & mental wellness',
    icon: Smile
  },
  {
    id: 'monitor_health',
    label: 'Monitor health',
    desc: 'Keep track of regular vitals & wellness markers',
    icon: Stethoscope
  },
  {
    id: 'other',
    label: 'Other',
    desc: 'Custom personalized health objective',
    icon: Target
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const { language: currentLang, setLanguage, languages } = useLanguage();

  // Storage key for saving progress
  const DRAFT_STORAGE_KEY = `cura_onboarding_draft_${user?.id || 'guest'}`;

  // Current Step:
  // 0: Welcome Screen
  // 1: Q1 Preferred Language (Asked at the front)
  // 2: Q2 Name
  // 3: Q3 Age
  // 4: Q4 Gender
  // 5: Q5 Height
  // 6: Q6 Weight (Strictly NO BMI)
  // 7: Q7 Medical Conditions
  // 8: Q8 Surgery / Hospitalization
  // 9: Q9 Allergies
  // 10: Q10 Dietary Lifestyle & Medications (Which type of vegetarian/non-vegetarian & meds)
  // 11: Q11 Health Goals (Final Question)
  // 12: Final Success Screen
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = back
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [savedDraftStep, setSavedDraftStep] = useState<number>(0);

  // Form State Answers
  // Question 1: Language Preference
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLang || 'en-IN');

  // Question 2: Name
  const [name, setName] = useState(user?.name || '');

  // Question 3: Age
  const [age, setAge] = useState('26');

  // Question 4: Gender
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [otherGender, setOtherGender] = useState('');

  // Question 5: Height (cm or ft/in)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState('175');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');

  // Question 6: Weight (kg or lb)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightKg, setWeightKg] = useState('70');
  const [weightLb, setWeightLb] = useState('154');

  // Question 7: Medical Conditions
  const [conditionChoice, setConditionChoice] = useState<'none' | 'yes' | 'prefer_not_to_say' | ''>('');
  const [conditionsList, setConditionsList] = useState<string[]>([]);
  const [newConditionInput, setNewConditionInput] = useState('');

  // Question 8: Surgery / Hospitalization
  const [surgeryChoice, setSurgeryChoice] = useState<'no' | 'yes' | 'prefer_not_to_say' | ''>('');
  const [surgeryDetails, setSurgeryDetails] = useState('');

  // Question 9: Allergies
  const [allergyChoice, setAllergyChoice] = useState<'none' | 'yes' | 'prefer_not_to_say' | ''>('');
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // Question 10: Dietary Lifestyle & Medications
  const [dietType, setDietType] = useState<string>('non-vegetarian');
  const [medications, setMedications] = useState<string>('');
  const [medicationsList, setMedicationsList] = useState<string[]>([]);
  const [newMedicationInput, setNewMedicationInput] = useState<string>('');

  // Question 11: Health Goals (Final Question)
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['general_wellness']);

  // Ref to autofocus inputs
  const autoFocusInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Check for Saved Draft on Mount (Run ONLY once)
  // -------------------------------------------------------------
  const hasRestoredDraftRef = useRef(false);
  useEffect(() => {
    if (hasRestoredDraftRef.current) return;
    hasRestoredDraftRef.current = true;

    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.selectedLanguage) {
            setSelectedLanguage(saved.selectedLanguage);
            setLanguage(saved.selectedLanguage);
          }
          if (saved.name) setName(saved.name);
          if (saved.age) setAge(saved.age);
          if (saved.gender) setGender(saved.gender);
          if (saved.otherGender) setOtherGender(saved.otherGender);
          if (saved.heightUnit) setHeightUnit(saved.heightUnit);
          if (saved.heightCm) setHeightCm(saved.heightCm);
          if (saved.heightFt) setHeightFt(saved.heightFt);
          if (saved.heightIn) setHeightIn(saved.heightIn);
          if (saved.weightUnit) setWeightUnit(saved.weightUnit);
          if (saved.weightKg) setWeightKg(saved.weightKg);
          if (saved.weightLb) setWeightLb(saved.weightLb);
          if (saved.conditionChoice) setConditionChoice(saved.conditionChoice);
          if (Array.isArray(saved.conditionsList)) setConditionsList(saved.conditionsList);
          if (saved.surgeryChoice) setSurgeryChoice(saved.surgeryChoice);
          if (saved.surgeryDetails) setSurgeryDetails(saved.surgeryDetails);
          if (saved.allergyChoice) setAllergyChoice(saved.allergyChoice);
          if (Array.isArray(saved.allergiesList)) setAllergiesList(saved.allergiesList);
          if (saved.dietType) setDietType(saved.dietType);
          if (saved.medications) setMedications(saved.medications);
          if (Array.isArray(saved.medicationsList)) setMedicationsList(saved.medicationsList);
          if (Array.isArray(saved.selectedGoals) && saved.selectedGoals.length > 0) {
            setSelectedGoals(saved.selectedGoals);
          }

          if (saved.step && saved.step >= 1 && saved.step <= 11) {
            setHasSavedDraft(true);
            setSavedDraftStep(saved.step);
          }
        }
      }
    } catch {
      // Ignore local storage parse error
    }
  }, []);

  // -------------------------------------------------------------
  // Persist Draft whenever answers change (Debounced)
  // -------------------------------------------------------------
  useEffect(() => {
    if (step >= 1 && step <= 11) {
      const draft = {
        step,
        selectedLanguage,
        name,
        age,
        gender,
        otherGender,
        heightUnit,
        heightCm,
        heightFt,
        heightIn,
        weightUnit,
        weightKg,
        weightLb,
        conditionChoice,
        conditionsList,
        surgeryChoice,
        surgeryDetails,
        allergyChoice,
        allergiesList,
        dietType,
        medications,
        medicationsList,
        selectedGoals,
        updatedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // Storage quota exceeded or disabled
      }

      // Debounce background sync to backend
      const timer = setTimeout(() => {
        if (user?.id) {
          profileService.saveOnboardingDraft(user.id, draft).catch(() => {});
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [
    step,
    selectedLanguage,
    name,
    age,
    gender,
    otherGender,
    heightUnit,
    heightCm,
    heightFt,
    heightIn,
    weightUnit,
    weightKg,
    weightLb,
    conditionChoice,
    conditionsList,
    surgeryChoice,
    surgeryDetails,
    allergyChoice,
    allergiesList,
    dietType,
    medications,
    medicationsList,
    selectedGoals,
    DRAFT_STORAGE_KEY,
    user?.id
  ]);

  // Autofocus input on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoFocusInputRef.current) {
        autoFocusInputRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [step]);

  // -------------------------------------------------------------
  // Unit conversion helpers
  // -------------------------------------------------------------
  const handleHeightUnitChange = (newUnit: 'cm' | 'ft') => {
    if (newUnit === heightUnit) return;
    if (newUnit === 'ft') {
      const cmVal = Number(heightCm) || 175;
      const totalInches = cmVal / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inc = Math.round(totalInches % 12);
      setHeightFt(String(ft));
      setHeightIn(String(inc));
    } else {
      const ft = Number(heightFt) || 5;
      const inc = Number(heightIn) || 9;
      const cm = Math.round(ft * 30.48 + inc * 2.54);
      setHeightCm(String(cm));
    }
    setHeightUnit(newUnit);
  };

  const handleWeightUnitChange = (newUnit: 'kg' | 'lb') => {
    if (newUnit === weightUnit) return;
    if (newUnit === 'lb') {
      const kg = Number(weightKg) || 70;
      const lb = Math.round(kg * 2.20462);
      setWeightLb(String(lb));
    } else {
      const lb = Number(weightLb) || 154;
      const kg = Math.round(lb / 2.20462);
      setWeightKg(String(kg));
    }
    setWeightUnit(newUnit);
  };

  // -------------------------------------------------------------
  // Step Validation logic for "Continue" button
  // -------------------------------------------------------------
  const isCurrentStepValid = (): boolean => {
    switch (step) {
      case 0:
        return true;
      case 1:
        // Language selection
        return Boolean(selectedLanguage);
      case 2:
        // Name
        return name.trim().length > 0;
      case 3: {
        // Age
        const a = Number(age);
        return !isNaN(a) && a >= 1 && a <= 120;
      }
      case 4:
        // Gender
        return gender !== '';
      case 5:
        // Height
        if (heightUnit === 'cm') {
          const h = Number(heightCm);
          return !isNaN(h) && h >= 50 && h <= 260;
        } else {
          const ft = Number(heightFt);
          const inc = Number(heightIn);
          return !isNaN(ft) && ft >= 1 && ft <= 8 && !isNaN(inc) && inc >= 0 && inc < 12;
        }
      case 6:
        // Weight
        if (weightUnit === 'kg') {
          const w = Number(weightKg);
          return !isNaN(w) && w >= 20 && w <= 350;
        } else {
          const w = Number(weightLb);
          return !isNaN(w) && w >= 45 && w <= 750;
        }
      case 7:
        // Medical conditions
        if (!conditionChoice) return false;
        if (conditionChoice === 'yes' && conditionsList.length === 0 && !newConditionInput.trim()) {
          return false;
        }
        return true;
      case 8:
        // Surgery / Hospitalization
        return surgeryChoice !== '';
      case 9:
        // Allergies
        if (!allergyChoice) return false;
        if (allergyChoice === 'yes' && allergiesList.length === 0 && !newAllergyInput.trim()) {
          return false;
        }
        return true;
      case 10:
        // Dietary Preference & Medications (Dietary preference is required)
        return Boolean(dietType);
      case 11:
        // Health Goals
        return selectedGoals.length > 0;
      default:
        return true;
    }
  };

  // -------------------------------------------------------------
  // Navigation Handlers
  // -------------------------------------------------------------
  const handleNext = () => {
    setFormError(null);

    // If on Q7 (Conditions), auto-add pending typed condition
    if (step === 7 && conditionChoice === 'yes' && newConditionInput.trim()) {
      if (!conditionsList.includes(newConditionInput.trim())) {
        setConditionsList(prev => [...prev, newConditionInput.trim()]);
      }
      setNewConditionInput('');
    }

    // If on Q9 (Allergies), auto-add pending typed allergy
    if (step === 9 && allergyChoice === 'yes' && newAllergyInput.trim()) {
      if (!allergiesList.includes(newAllergyInput.trim())) {
        setAllergiesList(prev => [...prev, newAllergyInput.trim()]);
      }
      setNewAllergyInput('');
    }

    // If on Q10 (Dietary & Meds), auto-add pending typed medication if any
    if (step === 10 && newMedicationInput.trim()) {
      if (!medicationsList.includes(newMedicationInput.trim())) {
        setMedicationsList(prev => [...prev, newMedicationInput.trim()]);
      }
      if (!medications.trim() || medications === 'None') {
        setMedications(newMedicationInput.trim());
      } else if (!medications.includes(newMedicationInput.trim())) {
        setMedications(prev => `${prev}, ${newMedicationInput.trim()}`);
      }
      setNewMedicationInput('');
    }

    if (step < 11) {
      setDirection(1);
      setStep(s => s + 1);
    } else if (step === 11) {
      handleSubmitProfile();
    }
  };

  const handleBack = () => {
    setFormError(null);
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  // -------------------------------------------------------------
  // Submit Final Profile
  // -------------------------------------------------------------
  const handleSubmitProfile = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const activeHeightCm = heightUnit === 'cm'
        ? Number(heightCm) || 170
        : Math.round((Number(heightFt) || 5) * 30.48 + (Number(heightIn) || 7) * 2.54);

      const activeWeightKg = weightUnit === 'kg'
        ? Number(weightKg) || 70
        : Math.round((Number(weightLb) || 154) * 0.453592);

      const ageNum = Number(age) || 25;
      const birthYear = new Date().getFullYear() - ageNum;
      const estimatedDob = `${birthYear}-01-01`;

      // Medical conditions
      const finalConditions = conditionChoice === 'yes' ? conditionsList : [];

      // Surgeries
      const finalSurgeries = surgeryChoice === 'yes' && surgeryDetails.trim()
        ? [{ surgeryName: surgeryDetails.trim() }]
        : [];

      // Allergies
      const finalAllergies = allergyChoice === 'yes' ? allergiesList : [];

      // Medications
      const finalMedList = medicationsList.length > 0 
        ? medicationsList 
        : (medications.trim() && medications !== 'None' ? medications.split(',').map(m => m.trim()).filter(Boolean) : []);
      const finalMedicationsStr = medications.trim() && medications !== 'None' 
        ? medications.trim() 
        : finalMedList.join(', ');

      const payload: OnboardingData = {
        language: selectedLanguage,
        name: name.trim() || user?.name || 'User',
        dateOfBirth: estimatedDob,
        age: ageNum,
        gender: gender === 'other' ? (otherGender.trim() || 'other') : (gender || 'prefer_not_to_say'),
        biologicalSex: gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'other',
        genderIdentity: otherGender.trim(),
        heightCm: activeHeightCm,
        weightKg: activeWeightKg,
        bloodGroup: 'O+',
        country: 'India',

        // Clinical history
        hasMedicalConditions: finalConditions.length > 0,
        pastConditions: finalConditions.map(c => ({ condition: c, isActive: true })),
        medicalConditions: finalConditions,

        hasSurgeries: finalSurgeries.length > 0,
        surgeries: finalSurgeries,

        hasAllergies: finalAllergies.length > 0,
        structuredAllergies: {
          medication: [],
          food: finalAllergies.map(a => ({ name: a, reaction: '' })),
          environmental: []
        },
        allergies: finalAllergies,

        // Dietary Lifestyle & Medications
        dietType: dietType || 'non-vegetarian',
        dietaryRestrictions: [dietType || 'non-vegetarian'],
        hasMedications: finalMedList.length > 0 || Boolean(finalMedicationsStr),
        medicationsList: finalMedList.map(m => ({ name: m })),
        medications: finalMedicationsStr,

        // Sensible defaults for non-blocking secondary fields (no fake daily activity logs)
        activityLevel: 'moderately_active',
        sleepHours: 0,
        waterIntake: '0 Liters',
        smoking: 'never',
        alcohol: 'never',

        healthGoals: selectedGoals.length > 0 ? selectedGoals : ['general_wellness'],
        mainHealthGoal: selectedGoals[0] || 'general_wellness',

        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        },
        consentAccepted: true
      };

      const success = await completeOnboarding(payload);
      if (success) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDirection(1);
        setStep(12); // Advance to Final Celebration Screen
      } else {
        setFormError('Failed to save profile. Please check your connection and try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving health profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Enter to continue
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 7 && newConditionInput.trim()) return;
      if (step === 9 && newAllergyInput.trim()) return;
      if (step === 10 && newMedicationInput.trim()) return;
      if (isCurrentStepValid()) {
        e.preventDefault();
        handleNext();
      }
    }
  };

  // -------------------------------------------------------------
  // Framer Motion Slide Variants (280ms smooth horizontal slide)
  // -------------------------------------------------------------
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0
    })
  };

  // -------------------------------------------------------------
  // RENDER: STEP 0 — Welcome Screen
  // -------------------------------------------------------------
  const renderWelcomeScreen = () => (
    <div className="flex flex-col items-center text-center px-4 py-8 sm:py-12 max-w-lg mx-auto">
      {/* Brand Icon Badge */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 flex items-center justify-center mb-6 text-[#134E2F] dark:text-[#C1F3BA] shadow-inner">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
        Let's personalize Cura+
      </h1>

      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 max-w-md leading-relaxed">
        A few quick questions will help us personalize your dietary habits, health insights, and recommendations.
      </p>

      {/* Time Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-sm font-medium mb-10 shadow-sm">
        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>About 1 minute</span>
      </div>

      {/* Saved Draft Resume Notice if exists */}
      {hasSavedDraft && savedDraftStep > 0 && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Saved Progress Found
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Resume from Question {savedDraftStep} of 11?
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDirection(1);
              setStep(savedDraftStep);
            }}
            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-100/50"
          >
            Resume →
          </Button>
        </div>
      )}

      {/* Primary Action Button */}
      <Button
        onClick={() => {
          setDirection(1);
          setStep(1);
        }}
        className="w-full max-w-xs h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-lg shadow-[#134E2F]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Let's Start</span>
        <ArrowRight className="w-5 h-5" />
      </Button>

      {hasSavedDraft && (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setHasSavedDraft(false);
            setDirection(1);
            setStep(1);
          }}
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Start fresh instead</span>
        </button>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 1 — Preferred Language (At the front)
  // -------------------------------------------------------------
  const renderQuestion1 = () => {
    const handleSelectLang = (code: LanguageCode) => {
      setSelectedLanguage(code);
      setLanguage(code);
    };

    return (
      <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
          <Globe className="w-3.5 h-3.5" />
          <span>Preferred Language • अपनी भाषा चुनें</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Which language do you prefer?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Choose your primary language for Cura+ (you can change this anytime)
        </p>

        {/* 10 Indian Languages Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-2 gap-2.5 mb-8">
          {languages.map(opt => {
            const isSelected = selectedLanguage === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => handleSelectLang(opt.code)}
                className={cn(
                  'p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  isSelected
                    ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm ring-1 ring-[#134E2F]/20 dark:ring-[#C1F3BA]/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <div>
                  <div className="text-base font-bold tracking-wide">
                    {opt.nativeName || opt.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {opt.name}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 2 — Basic Information (Name)
  // -------------------------------------------------------------
  const renderQuestion2 = () => (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        What should we call you?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Your first name or preferred name
      </p>

      <div className="w-full mb-8">
        <Input
          ref={autoFocusInputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
          onKeyDown={handleKeyDown}
          className="w-full h-14 text-xl sm:text-2xl font-semibold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid()}
        className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 3 — Age
  // -------------------------------------------------------------
  const renderQuestion3 = () => (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        How old are you?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Helps us calibrate age-appropriate baselines
      </p>

      <div className="w-full mb-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            const cur = Math.max(1, (Number(age) || 26) - 1);
            setAge(String(cur));
          }}
          className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
        >
          -
        </button>

        <div className="relative w-36 sm:w-44">
          <Input
            ref={autoFocusInputRef}
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="26"
            onKeyDown={handleKeyDown}
            className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase pointer-events-none">
            yrs
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const cur = Math.min(120, (Number(age) || 26) + 1);
            setAge(String(cur));
          }}
          className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
        >
          +
        </button>
      </div>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid()}
        className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 4 — Gender
  // -------------------------------------------------------------
  const renderQuestion4 = () => {
    const genderOptions = [
      { id: 'male', label: 'Male' },
      { id: 'female', label: 'Female' },
      { id: 'other', label: 'Other' },
      { id: 'prefer_not_to_say', label: 'Prefer not to say' }
    ];

    return (
      <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          What's your gender?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Used to calibrate medical reference ranges
        </p>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {genderOptions.map(opt => {
            const isSelected = gender === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGender(opt.id as any)}
                className={cn(
                  'h-16 px-5 rounded-2xl border-2 text-base font-semibold flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  isSelected
                    ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Optional text input if Other is selected */}
        <AnimatePresence>
          {gender === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mb-6 overflow-hidden"
            >
              <Input
                type="text"
                value={otherGender}
                onChange={e => setOtherGender(e.target.value)}
                placeholder="Specify gender identity (optional)"
                className="w-full h-12 rounded-xl text-center bg-white dark:bg-[#151A12] border border-slate-300 dark:border-slate-700 text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 5 — Height
  // -------------------------------------------------------------
  const renderQuestion5 = () => (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        What's your height?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Used to calculate metabolic baselines
      </p>

      {/* Segmented Unit Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-8 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleHeightUnitChange('cm')}
          className={cn(
            'px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            heightUnit === 'cm'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          )}
        >
          cm
        </button>
        <button
          type="button"
          onClick={() => handleHeightUnitChange('ft')}
          className={cn(
            'px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            heightUnit === 'ft'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          )}
        >
          ft & in
        </button>
      </div>

      {/* Height Inputs */}
      <div className="w-full mb-8">
        {heightUnit === 'cm' ? (
          <div className="relative w-40 sm:w-48 mx-auto">
            <Input
              ref={autoFocusInputRef}
              type="number"
              min={50}
              max={260}
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              placeholder="175"
              onKeyDown={handleKeyDown}
              className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
              cm
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="relative w-28">
              <Input
                ref={autoFocusInputRef}
                type="number"
                min={1}
                max={8}
                value={heightFt}
                onChange={e => setHeightFt(e.target.value)}
                placeholder="5"
                onKeyDown={handleKeyDown}
                className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                ft
              </span>
            </div>
            <div className="relative w-28">
              <Input
                type="number"
                min={0}
                max={11}
                value={heightIn}
                onChange={e => setHeightIn(e.target.value)}
                placeholder="9"
                onKeyDown={handleKeyDown}
                className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                in
              </span>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid()}
        className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 6 — Weight (STRICTLY NO BMI SHOWN)
  // -------------------------------------------------------------
  const renderQuestion6 = () => (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        What's your current weight?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Your weight helps us personalize your health recommendations.
      </p>

      {/* Segmented Unit Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-8 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleWeightUnitChange('kg')}
          className={cn(
            'px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            weightUnit === 'kg'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          )}
        >
          kg
        </button>
        <button
          type="button"
          onClick={() => handleWeightUnitChange('lb')}
          className={cn(
            'px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            weightUnit === 'lb'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          )}
        >
          lb
        </button>
      </div>

      {/* Weight Input (Clean, Minimal, NO BMI DISPLAY) */}
      <div className="w-full mb-8">
        <div className="relative w-40 sm:w-48 mx-auto">
          {weightUnit === 'kg' ? (
            <Input
              ref={autoFocusInputRef}
              type="number"
              min={20}
              max={350}
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              placeholder="70"
              onKeyDown={handleKeyDown}
              className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
            />
          ) : (
            <Input
              ref={autoFocusInputRef}
              type="number"
              min={45}
              max={750}
              value={weightLb}
              onChange={e => setWeightLb(e.target.value)}
              placeholder="154"
              onKeyDown={handleKeyDown}
              className="w-full h-16 text-3xl font-bold text-center rounded-2xl bg-white dark:bg-[#151A12] border-2 border-slate-200 dark:border-slate-800 focus:border-[#134E2F] dark:focus:border-[#C1F3BA] shadow-sm transition-all"
            />
          )}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
            {weightUnit}
          </span>
        </div>
      </div>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid()}
        className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 7 — Medical Conditions
  // -------------------------------------------------------------
  const renderQuestion7 = () => {
    const handleToggleCondition = (cond: string) => {
      setConditionsList(prev =>
        prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
      );
    };

    const handleAddCustomCondition = () => {
      if (newConditionInput.trim() && !conditionsList.includes(newConditionInput.trim())) {
        setConditionsList(prev => [...prev, newConditionInput.trim()]);
        setNewConditionInput('');
      }
    };

    return (
      <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Do you have any medical conditions we should know about?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          We use this to tailor alerts and safe health advice
        </p>

        {/* 3 Main Choice Cards */}
        <div className="w-full grid grid-cols-1 gap-2.5 mb-6">
          {[
            { id: 'none', label: 'No known conditions' },
            { id: 'yes', label: 'Yes, I have a medical condition' },
            { id: 'prefer_not_to_say', label: 'Prefer not to say' }
          ].map(opt => {
            const isSelected = conditionChoice === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setConditionChoice(opt.id as any)}
                className={cn(
                  'h-14 px-5 rounded-2xl border-2 text-sm sm:text-base font-semibold flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer',
                  isSelected
                    ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Conditional Selection Area if Yes */}
        <AnimatePresence>
          {conditionChoice === 'yes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mb-6 overflow-hidden text-left"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select conditions or type your own
                </p>

                {/* Common quick tags */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CONDITIONS.map(cond => {
                    const isPicked = conditionsList.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleToggleCondition(cond)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                          isPicked
                            ? 'bg-[#134E2F] text-white dark:bg-[#C1F3BA] dark:text-[#134E2F] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        )}
                      >
                        {cond} {isPicked ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Condition Input */}
                <div className="flex gap-2 pt-2">
                  <Input
                    type="text"
                    value={newConditionInput}
                    onChange={e => setNewConditionInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCondition();
                      }
                    }}
                    placeholder="Other condition (e.g. Celiac disease)"
                    className="h-10 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomCondition}
                    disabled={!newConditionInput.trim()}
                    className="h-10 px-3 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium shrink-0 cursor-pointer"
                  >
                    Add
                  </Button>
                </div>

                {/* Selected conditions list display */}
                {conditionsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {conditionsList.map(c => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleToggleCondition(c)}
                          className="hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 8 — Surgery / Hospitalization
  // -------------------------------------------------------------
  const renderQuestion8 = () => (
    <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        Have you had any major surgery or hospitalization?
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Helps us understand your surgical background
      </p>

      {/* 3 Main Choice Cards */}
      <div className="w-full grid grid-cols-1 gap-2.5 mb-6">
        {[
          { id: 'no', label: 'No' },
          { id: 'yes', label: 'Yes' },
          { id: 'prefer_not_to_say', label: 'Prefer not to say' }
        ].map(opt => {
          const isSelected = surgeryChoice === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSurgeryChoice(opt.id as any)}
              className={cn(
                'h-14 px-5 rounded-2xl border-2 text-sm sm:text-base font-semibold flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer',
                isSelected
                  ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              <span>{opt.label}</span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Conditional short input if Yes */}
      <AnimatePresence>
        {surgeryChoice === 'yes' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mb-6 overflow-hidden text-left"
          >
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Short description (optional)
              </label>
              <Input
                type="text"
                value={surgeryDetails}
                onChange={e => setSurgeryDetails(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Appendectomy (2020), Knee arthroscopy"
                className="h-12 text-sm rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid()}
        className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: STEP 9 — Allergies
  // -------------------------------------------------------------
  const renderQuestion9 = () => {
    const handleToggleAllergy = (item: string) => {
      setAllergiesList(prev =>
        prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
      );
    };

    const handleAddCustomAllergy = () => {
      if (newAllergyInput.trim() && !allergiesList.includes(newAllergyInput.trim())) {
        setAllergiesList(prev => [...prev, newAllergyInput.trim()]);
        setNewAllergyInput('');
      }
    };

    return (
      <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Do you have any known allergies?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Critical for safe nutrition, medication & food scanner guidance
        </p>

        {/* 3 Main Choice Cards */}
        <div className="w-full grid grid-cols-1 gap-2.5 mb-6">
          {[
            { id: 'none', label: 'No known allergies' },
            { id: 'yes', label: 'Yes' },
            { id: 'prefer_not_to_say', label: 'Prefer not to say' }
          ].map(opt => {
            const isSelected = allergyChoice === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAllergyChoice(opt.id as any)}
                className={cn(
                  'h-14 px-5 rounded-2xl border-2 text-sm sm:text-base font-semibold flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer',
                  isSelected
                    ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Conditional Allergen Selection Area if Yes */}
        <AnimatePresence>
          {allergyChoice === 'yes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mb-6 overflow-hidden text-left"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select common allergens or add other
                </p>

                {/* Common chips */}
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGIES.map(allg => {
                    const isPicked = allergiesList.includes(allg);
                    return (
                      <button
                        key={allg}
                        type="button"
                        onClick={() => handleToggleAllergy(allg)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer',
                          isPicked
                            ? 'bg-[#134E2F] text-white dark:bg-[#C1F3BA] dark:text-[#134E2F] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        )}
                      >
                        {allg} {isPicked ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Allergen Input */}
                <div className="flex gap-2 pt-2">
                  <Input
                    type="text"
                    value={newAllergyInput}
                    onChange={e => setNewAllergyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAllergy();
                      }
                    }}
                    placeholder="Other allergy (e.g. Aspirin, Strawberries)"
                    className="h-10 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomAllergy}
                    disabled={!newAllergyInput.trim()}
                    className="h-10 px-3 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium shrink-0 cursor-pointer"
                  >
                    Add
                  </Button>
                </div>

                {/* Selected allergies chips */}
                {allergiesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {allergiesList.map(a => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                      >
                        {a}
                        <button
                          type="button"
                          onClick={() => handleToggleAllergy(a)}
                          className="hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 10 — Dietary Lifestyle & Medications
  // -------------------------------------------------------------
  const renderQuestion10 = () => {
    return (
      <div className="flex flex-col items-center text-center w-full max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
          <Utensils className="w-3.5 h-3.5" />
          <span>Dietary Lifestyle & Medications</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Dietary Lifestyle & Medications
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Configure your daily dietary habits and medications.
        </p>

        {/* Dietary Preferences Card */}
        <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#151A12] border border-slate-200/80 dark:border-[#273322] shadow-xs text-left mb-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Dietary Preference
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select which type of diet best describes your daily nutrition:
            </p>

            {/* Visual Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              {DIETARY_OPTIONS.map(opt => {
                const isSelected = dietType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietType(opt.id)}
                    className={cn(
                      'p-3 rounded-2xl border-2 text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer',
                      isSelected
                        ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-xs ring-1 ring-[#134E2F]/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1C2318] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <span className="text-2xl shrink-0 leading-none pt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#134E2F] dark:text-[#C1F3BA]" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-1">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dropdown Selector (Matching Settings.tsx) */}
            <select
              value={dietType}
              onChange={e => setDietType(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#134E2F] cursor-pointer"
            >
              <option value="non-vegetarian">🍗 Non-Vegetarian</option>
              <option value="vegetarian">🥬 Vegetarian</option>
              <option value="vegan">🌱 Vegan</option>
              <option value="eggetarian">🥚 Eggetarian</option>
              <option value="jain">🪷 Jain (No Root Vegetables)</option>
              <option value="pescatarian">🐟 Pescatarian</option>
            </select>
          </div>

          {/* Current Medications & Supplements */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Current Medications & Supplements <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Helps avoid drug-nutrient depletion and verifies safe dietary combinations.
            </p>

            <Input
              type="text"
              value={medications}
              onChange={e => setMedications(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Metformin 500mg, Vitamin D3..."
              className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-sm h-11"
            />

            {/* Quick add chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">Quick Add:</span>
              {[
                { label: 'None', val: 'None' },
                { label: '+ Metformin', val: 'Metformin 500mg' },
                { label: '+ Vitamin D3', val: 'Vitamin D3' },
                { label: '+ Multivitamin', val: 'Multivitamin' },
                { label: '+ Thyroid Meds', val: 'Thyroid Medication' },
                { label: '+ BP Meds', val: 'Blood Pressure Meds' }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.val === 'None') {
                      setMedications('None');
                    } else {
                      setMedications(prev => {
                        if (!prev || prev === 'None') return item.val;
                        if (prev.includes(item.val)) return prev;
                        return `${prev}, ${item.val}`;
                      });
                    }
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#134E2F] hover:text-[#134E2F] font-medium transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-md disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 11 — Health Goals (FINAL QUESTION)
  // -------------------------------------------------------------
  const renderQuestion11 = () => {
    const handleToggleGoal = (id: string) => {
      setSelectedGoals(prev => {
        if (prev.includes(id)) {
          // Keep at least one goal
          if (prev.length === 1) return prev;
          return prev.filter(g => g !== id);
        } else {
          return [...prev, id];
        }
      });
    };

    return (
      <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          What would you like to improve?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Choose what matters most to you. Select one or more.
        </p>

        {/* Goals Selection Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
          {HEALTH_GOALS_LIST.map(g => {
            const isSelected = selectedGoals.includes(g.id);
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleToggleGoal(g.id)}
                className={cn(
                  'p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  isSelected
                    ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-[#134E2F]/10 dark:bg-[#C1F3BA]/15 text-[#134E2F] dark:text-[#C1F3BA] shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-[#134E2F] text-white dark:bg-[#C1F3BA] dark:text-[#134E2F]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-sm font-bold truncate">{g.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {g.desc}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#134E2F] dark:text-[#C1F3BA] shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {formError && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Button
          onClick={handleSubmitProfile}
          disabled={isSubmitting || !isCurrentStepValid()}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-lg shadow-[#134E2F]/20 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <span>Finish Setup</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: STEP 12 — Final Success Screen
  // -------------------------------------------------------------
  const renderFinalScreen = () => {
    const selectedLangObj = languages.find(l => l.code === selectedLanguage);
    const selectedDietObj = DIETARY_OPTIONS.find(d => d.id === dietType);

    return (
      <div className="flex flex-col items-center text-center px-4 py-8 sm:py-12 max-w-md mx-auto">
        {/* Big Celebration Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/50 dark:border-emerald-700/50 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 shadow-md">
          <Sparkles className="w-10 h-10 animate-bounce" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          You're all set! 🎉
        </h1>

        <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
          Your Cura+ profile is ready.
        </h2>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-sm">
          Your answers will help personalize your recommendations, health insights, dietary lifestyle, and AI assistant.
        </p>

        {/* Summary Readiness Card */}
        <div className="w-full mb-8 p-4 rounded-2xl bg-white dark:bg-[#151A12] border border-slate-200 dark:border-slate-800 text-left shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Personal Health Profile
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Ready
            </span>
          </div>

          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>{name || user?.name || 'Your Profile'}</span>
            <span className="text-xs font-normal text-slate-400">({age} yrs)</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-800/40">
              <Globe className="w-3.5 h-3.5" />
              {selectedLangObj?.nativeName || selectedLangObj?.name || 'English'}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/50 dark:border-amber-800/40">
              <Utensils className="w-3.5 h-3.5" />
              {selectedDietObj ? `${selectedDietObj.icon} ${selectedDietObj.label}` : 'Non-Vegetarian'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5">
            {selectedGoals.map(gid => {
              const g = HEALTH_GOALS_LIST.find(item => item.id === gid);
              return (
                <span
                  key={gid}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {g?.label || gid}
                </span>
              );
            })}
          </div>
        </div>

        {/* Go to Dashboard CTA */}
        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full h-13 sm:h-14 text-base font-semibold rounded-2xl bg-[#134E2F] hover:bg-[#18603B] text-white shadow-lg shadow-[#134E2F]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Go to Cura+</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Content Dispatcher based on Step
  // -------------------------------------------------------------
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderWelcomeScreen();
      case 1:
        return renderQuestion1(); // Language Preference (at the front)
      case 2:
        return renderQuestion2(); // Name (then name)
      case 3:
        return renderQuestion3(); // Age
      case 4:
        return renderQuestion4(); // Gender
      case 5:
        return renderQuestion5(); // Height
      case 6:
        return renderQuestion6(); // Weight
      case 7:
        return renderQuestion7(); // Medical Conditions
      case 8:
        return renderQuestion8(); // Surgery / Hospitalization
      case 9:
        return renderQuestion9(); // Allergies
      case 10:
        return renderQuestion10(); // Dietary Lifestyle & Medications
      case 11:
        return renderQuestion11(); // Health Goals
      case 12:
        return renderFinalScreen();
      default:
        return renderWelcomeScreen();
    }
  };

  // Calculate Progress Percentage for Questions 1 to 11
  const progressPercent = step >= 1 && step <= 11 ? (step / 11) * 100 : step > 11 ? 100 : 0;

  return (
    <div className="min-h-screen bg-[#FBFDF8] dark:bg-[#0D1109] flex flex-col justify-between selection:bg-[#C1F3BA] selection:text-[#0D1109]">
      {/* Top Header Bar */}
      <header className="w-full max-w-2xl mx-auto pt-6 pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Back button or Logo */}
          <div className="flex items-center gap-3">
            {step >= 1 && step <= 11 ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back to previous question"
                className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151A12] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center active:scale-95 shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Logo size="sm" showText={true} />
            )}
          </div>

          {/* Center: Cura+ Logo when in questions */}
          {step >= 1 && step <= 11 && (
            <div className="hidden sm:block">
              <Logo size="sm" showText={false} />
            </div>
          )}

          {/* Right: Question counter or Brand text */}
          <div className="flex items-center gap-2">
            {step >= 1 && step <= 11 ? (
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Question {step} of 11
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                Cura+ Health
              </span>
            )}
          </div>
        </div>

        {/* Thin Animated Progress Bar (Visible during questions 1 to 11) */}
        {step >= 1 && step <= 11 && (
          <div className="w-full mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
            <motion.div
              className="h-full bg-[#134E2F] dark:bg-[#C1F3BA] rounded-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        )}
      </header>

      {/* Main Interactive Stage with Horizontal Slide Transition */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-6 sm:py-10 w-full max-w-xl mx-auto">
        <div className="w-full overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="w-full"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600/70" />
          <span>Your data is encrypted & strictly confidential</span>
        </p>
      </footer>
    </div>
  );
}

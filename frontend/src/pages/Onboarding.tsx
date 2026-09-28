import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, ChevronRight, ChevronLeft,
  User, Heart, Activity, Phone, Sparkles, Loader2,
  Check, Plus, Trash2, AlertCircle, Stethoscope,
  Scissors, Pill, Bookmark, CheckCircle2,
  Zap, Clock, ArrowRight, Edit3,
  Flame, CheckCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import {
  PastConditionItem, SurgeryItem, AllergyItem,
  MedicationItem, FamilyHistoryItem,
  OnboardingData, profileService
} from '@/services/profile';

// Pre-defined condition options as specified
const CONDITION_OPTIONS = [
  'Diabetes', 'Hypertension', 'Heart disease', 'Asthma',
  'Thyroid disorder', 'Kidney disease', 'Liver disease', 'High cholesterol',
  'Arthritis', 'Migraine', 'Epilepsy / seizures', 'Respiratory condition',
  'Gastrointestinal condition', 'Cancer', 'Other'
];

const FOOD_ALLERGY_OPTIONS = [
  'Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Seafood',
  'Shellfish', 'Wheat / gluten', 'Soy', 'Other'
];

const ENV_ALLERGY_OPTIONS = [
  'Dust', 'Pollen', 'Pet dander', 'Mold', 'Latex', 'Other'
];

const FAMILY_CONDITION_OPTIONS = [
  'Diabetes', 'Hypertension', 'Heart disease', 'Stroke',
  'Cancer', 'High cholesterol', 'Kidney disease', 'Thyroid disease', 'Other'
];

const GOAL_OPTIONS = [
  { id: 'general_wellness', label: 'General wellness', desc: 'Maintain overall vitality & healthy habits' },
  { id: 'weight_management', label: 'Weight management', desc: 'Reach or maintain a healthy body mass' },
  { id: 'improve_fitness', label: 'Improve fitness', desc: 'Build stamina, cardio & strength' },
  { id: 'better_sleep', label: 'Better sleep', desc: 'Optimize rest cycles & restorative recovery' },
  { id: 'improve_nutrition', label: 'Improve nutrition', desc: 'Clean eating, macro tracking & hydration' },
  { id: 'stress_management', label: 'Stress management', desc: 'Mental balance & recovery pacing' },
  { id: 'monitor_blood_pressure', label: 'Monitor blood pressure', desc: 'Track cardiovascular baselines routinely' },
  { id: 'monitor_blood_sugar', label: 'Monitor blood sugar', desc: 'Glucose management & metabolic awareness' },
  { id: 'manage_condition', label: 'Manage an existing condition', desc: 'Coordinate care with verified lifestyle habits' },
  { id: 'other', label: 'Other', desc: 'Personalized wellness roadmap' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();

  // Storage key for saving progress
  const DRAFT_STORAGE_KEY = `cura_onboarding_draft_${user?.id || 'guest'}`;

  // Current Step:
  // 0: Welcome & Consent Screen
  // 1: Basic Profile
  // 2: Current Health Status
  // 3: Medical Conditions
  // 4: Surgeries & Hospitalization
  // 5: Allergies & Sensitivities
  // 6: Medications & Supplements
  // 7: Lifestyle
  // 8: Family Medical History
  // 9: Health Concerns & Goals
  // 10: Emergency & Review
  // 11: Generated Health Profile & Initial Wellness Summary
  const [step, setStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [savedDraftExists, setSavedDraftExists] = useState(false);
  const [savedDraftPercent, setSavedDraftPercent] = useState(0);

  // Consent
  const [consentAccepted, setConsentAccepted] = useState(false);

  // STEP 1 — Basic Profile
  const [fullName, setFullName] = useState(user?.name || '');
  const [dob, setDob] = useState('1998-05-15');
  const [calculatedAge, setCalculatedAge] = useState<number>(26);
  const [biologicalSex, setBiologicalSex] = useState<'male' | 'female' | 'other'>('male');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState('175');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightKg, setWeightKg] = useState('70');
  const [weightLb, setWeightLb] = useState('154');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [country, setCountry] = useState('United States');
  const [stateName, setStateName] = useState('California');
  const [city, setCity] = useState('San Francisco');

  // STEP 2 — Current Health Status (All Optional)
  const [knowsVitals, setKnowsVitals] = useState<boolean | null>(null);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [restingHeartRate, setRestingHeartRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [glucoseType, setGlucoseType] = useState<'fasting' | 'random' | 'other'>('fasting');
  const [bodyTemperature, setBodyTemperature] = useState('');

  // STEP 3 — Medical Conditions
  const [hasMedicalConditions, setHasMedicalConditions] = useState<boolean | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [conditionDetails, setConditionDetails] = useState<Record<string, {
    yearDiagnosed: string;
    isActive: boolean;
    isReceivingTreatment: boolean;
    notes: string;
  }>>({});

  // STEP 4 — Surgeries & Hospitalization
  const [hasSurgeries, setHasSurgeries] = useState<boolean | null>(null);
  const [surgeriesList, setSurgeriesList] = useState<SurgeryItem[]>([
    { surgeryName: '', reason: '', year: '', duration: '', complications: '' }
  ]);

  // STEP 5 — Allergies & Sensitivities
  const [hasMedAllergies, setHasMedAllergies] = useState<boolean | null>(null);
  const [medAllergiesList, setMedAllergiesList] = useState<AllergyItem[]>([
    { name: '', reaction: '' }
  ]);
  const [hasFoodAllergies, setHasFoodAllergies] = useState<boolean | null>(null);
  const [selectedFoodAllergies, setSelectedFoodAllergies] = useState<string[]>([]);
  const [hasEnvAllergies, setHasEnvAllergies] = useState<boolean | null>(null);
  const [selectedEnvAllergies, setSelectedEnvAllergies] = useState<string[]>([]);

  // STEP 6 — Medications & Supplements
  const [hasMedications, setHasMedications] = useState<boolean | null>(null);
  const [medicationsList, setMedicationsList] = useState<MedicationItem[]>([
    { name: '', dosage: '', frequency: 'Once daily', reason: '', isPrescribed: true, startDate: '' }
  ]);

  // STEP 7 — Lifestyle & Daily Habits
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  const [exerciseFrequency, setExerciseFrequency] = useState('3–4 days/week');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepQuality, setSleepQuality] = useState('Good');
  const [dietType, setDietType] = useState('Non-vegetarian');
  const [waterIntake, setWaterIntake] = useState('2.5');
  const [smoking, setSmoking] = useState('Never');
  const [alcohol, setAlcohol] = useState('Occasionally');
  const [stressLevel, setStressLevel] = useState<number>(2);

  // STEP 8 — Family Medical History
  const [hasFamilyHistory, setHasFamilyHistory] = useState<boolean | null>(null);
  const [familyConditionsList, setFamilyConditionsList] = useState<FamilyHistoryItem[]>([]);

  // STEP 9 — Health Concerns & Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['general_wellness']);
  const [healthConcerns, setHealthConcerns] = useState('');

  // STEP 10 — Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family / Friend');

  // -------------------------------------------------------------
  // Calculations: Age & Real-Time BMI
  // -------------------------------------------------------------
  useEffect(() => {
    if (dob) {
      const birth = new Date(dob);
      const now = new Date();
      let diff = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        diff--;
      }
      if (diff >= 0 && diff <= 125) {
        setCalculatedAge(diff);
      }
    }
  }, [dob]);

  const activeHeightCm = useMemo((): number => {
    if (heightUnit === 'cm') {
      return Number(heightCm) || 170;
    }
    const ft = Number(heightFt) || 0;
    const inch = Number(heightIn) || 0;
    return Math.round((ft * 12 + inch) * 2.54) || 170;
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const activeWeightKg = useMemo((): number => {
    if (weightUnit === 'kg') {
      return Number(weightKg) || 70;
    }
    const lb = Number(weightLb) || 0;
    return Number((lb * 0.453592).toFixed(1)) || 70;
  }, [weightUnit, weightKg, weightLb]);

  const bmiValue = useMemo(() => {
    const hM = activeHeightCm / 100;
    return hM > 0 ? Number((activeWeightKg / (hM * hM)).toFixed(1)) : 22.0;
  }, [activeHeightCm, activeWeightKg]);

  const bmiCategory = useMemo(() => {
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal weight';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  }, [bmiValue]);

  // Overall progress percentage
  const progressPercent = useMemo(() => {
    if (step === 0) return 5;
    if (step === 11) return 100;
    return Math.min(100, Math.round((step / 10) * 100));
  }, [step]);

  // -------------------------------------------------------------
  // Save Progress & Resume Later
  // -------------------------------------------------------------
  const collectCurrentState = () => ({
    step,
    consentAccepted,
    fullName,
    dob,
    calculatedAge,
    biologicalSex,
    genderIdentity,
    heightUnit,
    heightCm,
    heightFt,
    heightIn,
    weightUnit,
    weightKg,
    weightLb,
    bloodGroup,
    country,
    stateName,
    city,
    knowsVitals,
    bpSystolic,
    bpDiastolic,
    restingHeartRate,
    oxygenSaturation,
    bloodGlucose,
    glucoseType,
    bodyTemperature,
    hasMedicalConditions,
    selectedConditions,
    conditionDetails,
    hasSurgeries,
    surgeriesList,
    hasMedAllergies,
    medAllergiesList,
    hasFoodAllergies,
    selectedFoodAllergies,
    hasEnvAllergies,
    selectedEnvAllergies,
    hasMedications,
    medicationsList,
    activityLevel,
    exerciseFrequency,
    sleepHours,
    sleepQuality,
    dietType,
    waterIntake,
    smoking,
    alcohol,
    stressLevel,
    hasFamilyHistory,
    familyConditionsList,
    selectedGoals,
    healthConcerns,
    emergencyName,
    emergencyPhone,
    emergencyRelation,
    savedAt: new Date().toISOString(),
    completionPercentage: progressPercent,
  });

  const saveProgress = async (silent = false) => {
    const draft = collectCurrentState();
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      if (user?.id) {
        profileService.saveOnboardingDraft(user.id, draft).catch(() => {});
      }
      if (!silent) {
        setSaveToast('Progress saved! You can resume from any device anytime.');
        setTimeout(() => setSaveToast(null), 3500);
      }
    } catch {
      // ignore storage error
    }
  };

  // Restore draft on mount if available
  useEffect(() => {
    const restoreDraft = async () => {
      let savedData: any = null;
      try {
        const local = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (local) savedData = JSON.parse(local);
      } catch {}

      if (!savedData && user?.id) {
        const remote = await profileService.getOnboardingDraft(user.id).catch(() => null);
        if (remote?.data) savedData = remote.data;
      }

      if (savedData && savedData.step > 0) {
        setSavedDraftExists(true);
        setSavedDraftPercent(savedData.completionPercentage || Math.round((savedData.step / 10) * 100));
      }
    };

    restoreDraft();
  }, [user]);

  const applyDraft = (d: any) => {
    if (d.step !== undefined) setStep(d.step);
    if (d.consentAccepted !== undefined) setConsentAccepted(d.consentAccepted);
    if (d.fullName) setFullName(d.fullName);
    if (d.dob) setDob(d.dob);
    if (d.calculatedAge) setCalculatedAge(d.calculatedAge);
    if (d.biologicalSex) setBiologicalSex(d.biologicalSex);
    if (d.genderIdentity !== undefined) setGenderIdentity(d.genderIdentity);
    if (d.heightUnit) setHeightUnit(d.heightUnit);
    if (d.heightCm) setHeightCm(d.heightCm);
    if (d.weightUnit) setWeightUnit(d.weightUnit);
    if (d.weightKg) setWeightKg(d.weightKg);
    if (d.bloodGroup) setBloodGroup(d.bloodGroup);
    if (d.country) setCountry(d.country);
    if (d.stateName) setStateName(d.stateName);
    if (d.city) setCity(d.city);
    if (d.knowsVitals !== undefined) setKnowsVitals(d.knowsVitals);
    if (d.bpSystolic) setBpSystolic(d.bpSystolic);
    if (d.bpDiastolic) setBpDiastolic(d.bpDiastolic);
    if (d.restingHeartRate) setRestingHeartRate(d.restingHeartRate);
    if (d.oxygenSaturation) setOxygenSaturation(d.oxygenSaturation);
    if (d.bloodGlucose) setBloodGlucose(d.bloodGlucose);
    if (d.glucoseType) setGlucoseType(d.glucoseType);
    if (d.bodyTemperature) setBodyTemperature(d.bodyTemperature);
    if (d.hasMedicalConditions !== undefined) setHasMedicalConditions(d.hasMedicalConditions);
    if (d.selectedConditions) setSelectedConditions(d.selectedConditions);
    if (d.conditionDetails) setConditionDetails(d.conditionDetails);
    if (d.hasSurgeries !== undefined) setHasSurgeries(d.hasSurgeries);
    if (d.surgeriesList) setSurgeriesList(d.surgeriesList);
    if (d.hasMedAllergies !== undefined) setHasMedAllergies(d.hasMedAllergies);
    if (d.medAllergiesList) setMedAllergiesList(d.medAllergiesList);
    if (d.hasFoodAllergies !== undefined) setHasFoodAllergies(d.hasFoodAllergies);
    if (d.selectedFoodAllergies) setSelectedFoodAllergies(d.selectedFoodAllergies);
    if (d.hasEnvAllergies !== undefined) setHasEnvAllergies(d.hasEnvAllergies);
    if (d.selectedEnvAllergies) setSelectedEnvAllergies(d.selectedEnvAllergies);
    if (d.hasMedications !== undefined) setHasMedications(d.hasMedications);
    if (d.medicationsList) setMedicationsList(d.medicationsList);
    if (d.activityLevel) setActivityLevel(d.activityLevel);
    if (d.exerciseFrequency) setExerciseFrequency(d.exerciseFrequency);
    if (d.sleepHours) setSleepHours(d.sleepHours);
    if (d.sleepQuality) setSleepQuality(d.sleepQuality);
    if (d.dietType) setDietType(d.dietType);
    if (d.waterIntake) setWaterIntake(d.waterIntake);
    if (d.smoking) setSmoking(d.smoking);
    if (d.alcohol) setAlcohol(d.alcohol);
    if (d.stressLevel !== undefined) setStressLevel(d.stressLevel);
    if (d.hasFamilyHistory !== undefined) setHasFamilyHistory(d.hasFamilyHistory);
    if (d.familyConditionsList) setFamilyConditionsList(d.familyConditionsList);
    if (d.selectedGoals) setSelectedGoals(d.selectedGoals);
    if (d.healthConcerns) setHealthConcerns(d.healthConcerns);
    if (d.emergencyName) setEmergencyName(d.emergencyName);
    if (d.emergencyPhone) setEmergencyPhone(d.emergencyPhone);
    if (d.emergencyRelation) setEmergencyRelation(d.emergencyRelation);
  };

  const handleResumeSetup = () => {
    try {
      const local = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (local) {
        applyDraft(JSON.parse(local));
      }
    } catch {}
  };

  const handleStartFresh = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSavedDraftExists(false);
    setStep(0);
  };

  // -------------------------------------------------------------
  // Step Validation
  // -------------------------------------------------------------
  const validateStep = (): boolean => {
    setFormError(null);

    // Step 0: Consent
    if (step === 0) {
      if (!consentAccepted) {
        setFormError('Please review and check the health data privacy consent to proceed.');
        return false;
      }
    }

    // Step 1: Basic Profile
    if (step === 1) {
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        return false;
      }
      const birth = new Date(dob);
      const now = new Date();
      if (birth > now) {
        setFormError('Date of birth cannot be in the future.');
        return false;
      }
      if (calculatedAge < 1 || calculatedAge > 120) {
        setFormError('Please enter a valid date of birth (age between 1 and 120).');
        return false;
      }
      if (activeHeightCm < 50 || activeHeightCm > 280) {
        setFormError('Height must be between 50 cm and 280 cm.');
        return false;
      }
      if (activeWeightKg < 20 || activeWeightKg > 400) {
        setFormError('Weight must be between 20 kg and 400 kg.');
        return false;
      }
    }

    // Step 2: Measurements Validation (if entered)
    if (step === 2) {
      if (bpSystolic || bpDiastolic) {
        const sys = Number(bpSystolic);
        const dia = Number(bpDiastolic);
        if (isNaN(sys) || sys < 60 || sys > 250) {
          setFormError('Systolic blood pressure must be between 60 and 250 mmHg.');
          return false;
        }
        if (isNaN(dia) || dia < 40 || dia > 150) {
          setFormError('Diastolic blood pressure must be between 40 and 150 mmHg.');
          return false;
        }
        if (sys <= dia) {
          setFormError('Systolic pressure must be greater than diastolic pressure.');
          return false;
        }
      }
      if (restingHeartRate) {
        const hr = Number(restingHeartRate);
        if (isNaN(hr) || hr < 30 || hr > 220) {
          setFormError('Resting heart rate must be between 30 and 220 BPM.');
          return false;
        }
      }
      if (oxygenSaturation) {
        const spo2 = Number(oxygenSaturation);
        if (isNaN(spo2) || spo2 < 70 || spo2 > 100) {
          setFormError('Oxygen saturation (SpO₂) must be between 70% and 100%.');
          return false;
        }
      }
      if (bloodGlucose) {
        const glu = Number(bloodGlucose);
        if (isNaN(glu) || glu < 40 || glu > 600) {
          setFormError('Blood glucose must be between 40 and 600 mg/dL.');
          return false;
        }
      }
    }

    // Step 10: Emergency Phone Validation (optional, but validate format if entered)
    if (step === 10) {
      if (emergencyPhone.trim() && emergencyPhone.trim().length < 7) {
        setFormError('Please enter a valid phone number with area code.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    saveProgress(true);
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setFormError(null);
    setStep(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // Final Confirmation & Profile Submission
  // -------------------------------------------------------------
  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const finalConditions: PastConditionItem[] = hasMedicalConditions
        ? selectedConditions.filter(c => c !== 'None').map(cond => {
            const detail = conditionDetails[cond] || { yearDiagnosed: '', isActive: true, isReceivingTreatment: false, notes: '' };
            return {
              condition: cond,
              yearDiagnosed: detail.yearDiagnosed,
              isActive: detail.isActive,
              isReceivingTreatment: detail.isReceivingTreatment,
              notes: detail.notes,
            };
          })
        : [];

      const finalSurgeries: SurgeryItem[] = hasSurgeries
        ? surgeriesList.filter(s => s.surgeryName.trim())
        : [];

      const finalMedAllergies: AllergyItem[] = hasMedAllergies
        ? medAllergiesList.filter(m => m.name.trim())
        : [];

      const finalFoodAllergies: AllergyItem[] = (selectedFoodAllergies || []).map(f => ({
        name: f,
        reaction: 'Reported allergy'
      }));

      const finalEnvAllergies: AllergyItem[] = (selectedEnvAllergies || []).map(e => ({
        name: e,
        reaction: 'Reported sensitivity'
      }));

      const finalMedications: MedicationItem[] = hasMedications
        ? medicationsList.filter(m => m.name.trim())
        : [];

      const finalFamilyHistory: FamilyHistoryItem[] = hasFamilyHistory
        ? familyConditionsList.filter(f => f.condition.trim())
        : [];

      const payload: OnboardingData = {
        name: fullName.trim(),
        dateOfBirth: dob,
        age: calculatedAge,
        gender: biologicalSex,
        biologicalSex,
        genderIdentity,
        heightCm: activeHeightCm,
        weightKg: activeWeightKg,
        bloodGroup,
        country,
        state: stateName,
        city,
        // Optional Vitals
        measurements: {
          bloodPressureSystolic: bpSystolic ? Number(bpSystolic) : null,
          bloodPressureDiastolic: bpDiastolic ? Number(bpDiastolic) : null,
          restingHeartRate: restingHeartRate ? Number(restingHeartRate) : null,
          oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : null,
          bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
          glucoseType,
          bodyTemperature: bodyTemperature ? Number(bodyTemperature) : null,
        },
        bloodPressureSystolic: bpSystolic ? Number(bpSystolic) : null,
        bloodPressureDiastolic: bpDiastolic ? Number(bpDiastolic) : null,
        restingHeartRate: restingHeartRate ? Number(restingHeartRate) : null,
        oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : null,
        bloodGlucose: bloodGlucose ? Number(bloodGlucose) : null,
        glucoseType,
        bodyTemperature: bodyTemperature ? Number(bodyTemperature) : null,

        // Medical History
        hasMedicalConditions: hasMedicalConditions === true,
        pastConditions: finalConditions,
        medicalConditions: finalConditions.map(c => c.condition),

        // Surgeries
        hasSurgeries: hasSurgeries === true,
        surgeries: finalSurgeries,

        // Allergies
        hasAllergies: (finalMedAllergies.length > 0 || finalFoodAllergies.length > 0 || finalEnvAllergies.length > 0),
        structuredAllergies: {
          medication: finalMedAllergies,
          food: finalFoodAllergies,
          environmental: finalEnvAllergies,
        },
        allergies: [
          ...finalFoodAllergies.map(f => f.name),
          ...finalMedAllergies.map(m => m.name),
          ...finalEnvAllergies.map(e => e.name),
        ],

        // Medications
        hasMedications: hasMedications === true,
        medicationsList: finalMedications,
        medications: finalMedications.map(m => `${m.name} (${m.dosage || 'dose N/A'})`).join(', '),

        // Lifestyle
        activityLevel,
        exerciseFrequency,
        sleepHours: Number(sleepHours) || 7.5,
        sleepQuality,
        dietType,
        waterIntake: `${waterIntake} Liters`,
        smoking,
        alcohol,
        stressLevel,

        // Family History
        hasFamilyHistory: hasFamilyHistory === true,
        familyHistoryList: finalFamilyHistory,
        familyHistory: finalFamilyHistory.map(f => `${f.condition} (${f.relationship})`).join(', '),

        // Goals & Concerns
        healthGoals: selectedGoals.length > 0 ? selectedGoals : ['general_wellness'],
        mainHealthGoal: selectedGoals[0] || 'general_wellness',
        healthConcerns,

        // Emergency
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: emergencyRelation,
        },
        consentAccepted: true,
      };

      const success = await completeOnboarding(payload);
      if (success) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        // Advance to Generated Summary screen (Step 11)
        setStep(11);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError('Failed to save health profile. Please check your connection.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving health profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Initial Health Summary Generator (Strictly non-diagnostic)
  // -------------------------------------------------------------
  const healthInsights = useMemo(() => {
    const positives: string[] = [];
    const monitor: string[] = [];
    const suggestions: string[] = [];

    // BMI Indicator (Clear non-diagnostic note)
    if (bmiValue >= 18.5 && bmiValue < 25) {
      positives.push(`Calculated Body Mass Index (${bmiValue} kg/m²) aligns with standard demographic baseline.`);
    } else if (bmiValue >= 25 && bmiValue < 30) {
      monitor.push(`Calculated Body Mass Index (${bmiValue} kg/m²) is slightly elevated. A balanced nutritional plan may assist.`);
    } else if (bmiValue >= 30) {
      monitor.push(`Calculated Body Mass Index (${bmiValue} kg/m²) is in an elevated range. Consider discussing personalized pacing with a healthcare professional.`);
    } else if (bmiValue < 18.5) {
      monitor.push(`Calculated Body Mass Index (${bmiValue} kg/m²) is on the lower margin. Focus on nutrient-dense calorie sources.`);
    }

    // Blood Pressure
    if (bpSystolic && bpDiastolic) {
      const sys = Number(bpSystolic);
      const dia = Number(bpDiastolic);
      if (sys < 120 && dia < 80) {
        positives.push(`Reported blood pressure (${sys}/${dia} mmHg) is within optimal resting ranges.`);
      } else if (sys >= 130 || dia >= 85) {
        monitor.push(`Blood pressure (${sys}/${dia} mmHg) shows mild elevation. Regular monitoring is recommended.`);
      }
    }

    // Oxygen
    if (oxygenSaturation) {
      const spo2 = Number(oxygenSaturation);
      if (spo2 >= 95) {
        positives.push(`Reported oxygen saturation (${spo2}%) reflects healthy respiratory efficiency.`);
      } else {
        monitor.push(`Resting oxygen saturation (${spo2}%) is on the lower threshold. Consider discussing this with a doctor if shortness of breath occurs.`);
      }
    }

    // Blood Glucose
    if (bloodGlucose) {
      const glu = Number(bloodGlucose);
      if (glu >= 70 && glu <= 99 && glucoseType === 'fasting') {
        positives.push(`Fasting glucose level (${glu} mg/dL) is within typical physiological baseline.`);
      } else if (glu >= 100 && glucoseType === 'fasting') {
        monitor.push(`Fasting glucose (${glu} mg/dL) is above typical baseline. Periodic re-testing is recommended.`);
      }
    }

    // Sleep
    const sleep = Number(sleepHours) || 7.5;
    if (sleep >= 7 && sleep <= 9) {
      positives.push(`Daily sleep duration (${sleep} hours) supports restorative neurological and cellular recovery.`);
    } else if (sleep < 6.5) {
      monitor.push(`Reported sleep duration (${sleep} hours) is below recommended restorative thresholds.`);
    }

    // Physical Activity
    if (exerciseFrequency.includes('3–4') || exerciseFrequency.includes('5+')) {
      positives.push(`Active weekly exercise habit (${exerciseFrequency}) promotes cardiovascular health.`);
    } else if (exerciseFrequency.includes('Never') || exerciseFrequency.includes('1–2')) {
      suggestions.push('Aim for 150 minutes of moderate aerobic activity weekly to boost cardiovascular conditioning.');
    }

    // Tobacco & Alcohol
    if (smoking === 'Never') {
      positives.push('Tobacco-free status avoids significant pulmonary and vascular stressors.');
    } else if (smoking === 'Current') {
      monitor.push('Current tobacco usage is a primary factor worth discussing with a health counselor.');
    }

    // General Suggestions based on user-provided inputs
    suggestions.push(`Target at least ${waterIntake || '2.5'} Liters of water daily to maintain metabolic and hydration balance.`);
    suggestions.push('Utilize Cura+ food OCR barcode scanner to verify ingredients and avoid allergy cross-contamination.');
    suggestions.push('Keep health logs updated so the AI assistant can recognize long-term wellness patterns.');

    return { positives, monitor, suggestions };
  }, [bmiValue, bpSystolic, bpDiastolic, oxygenSaturation, bloodGlucose, glucoseType, sleepHours, exerciseFrequency, smoking, waterIntake]);

  return (
    <div className="min-h-screen bg-[#FBFDF8] text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#C1F3BA] selection:text-[#134E2F]">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#C1F3BA]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#15E6CD]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem('cura_just_registered');
              if (user) {
                const updated = { ...user, isOnboarded: true };
                localStorage.setItem('cura_auth_user', JSON.stringify(updated));
              }
              navigate('/dashboard', { replace: true });
            }}
            className="text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 h-8 px-3 rounded-xl"
          >
            Dashboard
          </Button>

          {step > 0 && step <= 10 && (
            <button
              onClick={() => saveProgress(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#134E2F] bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-xl shadow-sm transition-all hover:bg-[#F2FBF1]"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#134E2F]" />
              <span className="hidden sm:inline">Save Progress</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-black text-[#134E2F] bg-[#C1F3BA] px-3.5 py-1.5 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Health Setup Wizard</span>
          </div>
        </div>
      </header>

      {/* Save Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-[#134E2F] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#18603B] flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#C1F3BA]" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-start items-center p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full">
        {/* Progress Bar & Step Tracker (Visible during Steps 1-10) */}
        {step > 0 && step <= 10 && (
          <div className="w-full mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span className="text-slate-900 font-extrabold flex items-center gap-2">
                <span>Step {step} of 10</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold">
                  {step === 1 && 'Basic Profile'}
                  {step === 2 && 'Current Health Status'}
                  {step === 3 && 'Medical Conditions'}
                  {step === 4 && 'Surgeries & Hospitalization'}
                  {step === 5 && 'Allergies & Sensitivities'}
                  {step === 6 && 'Medications & Supplements'}
                  {step === 7 && 'Lifestyle & Habits'}
                  {step === 8 && 'Family Medical History'}
                  {step === 9 && 'Health Concerns & Goals'}
                  {step === 10 && 'Emergency & Review'}
                </span>
              </span>
              <span className="text-[#134E2F] font-black">{progressPercent}% Completed</span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div
                className="h-full bg-[#134E2F] relative rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-[#C1F3BA] rounded-full" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-6 p-4 bg-[#FF6554]/10 border border-[#FF6554]/30 text-[#D93D2C] text-xs font-bold rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        )}

        {/* Multi-Step Card Wrapper */}
        <div className="w-full bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-10">

          {/* ======================================================== */}
          {/* STEP 0: WELCOME & PRIVACY CONSENT SCREEN */}
          {/* ======================================================== */}
          {step === 0 && (
            <div className="space-y-6">
              {savedDraftExists && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF8E7] border border-[#C1F3BA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C1F3BA] text-[#134E2F] flex items-center justify-center font-bold shrink-0">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#134E2F]">
                        Welcome back! Your health profile is {savedDraftPercent}% complete.
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Resume right where you stopped, or start fresh anytime.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleResumeSetup}
                      className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm"
                    >
                      Continue Setup
                    </Button>
                    <button
                      onClick={handleStartFresh}
                      className="text-xs font-semibold text-slate-500 hover:text-[#FF6554] px-3 py-2"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C1F3BA]/40 text-[#134E2F] text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Welcome to Cura+</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Let's build your health profile
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                  Answer a few questions so Cura+ can understand your health background and personalize your wellness recommendations, nutritional checks, and vitals tracking.
                </p>
              </div>

              {/* Informational feature badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#134E2F] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3–5 Minutes</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Short, progressive questions focused on your wellbeing.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Bookmark className="w-5 h-5 text-[#134E2F] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Save & Continue Later</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Your progress saves automatically so you never lose data.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#134E2F] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Private & Confidential</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Encrypted under HIPAA-grade clinical protocols.</p>
                  </div>
                </div>
              </div>

              {/* Privacy Notice & Consent Agreement */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#134E2F]" />
                  <span>How Your Health Information Is Handled</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cura+ uses your biometric baselines (such as age, height, allergies, and lifestyle habits) to personalize AI safety checks, calorie targets, and medication reminder alerts.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs leading-relaxed">
                  <strong>Clinical Notice:</strong> Cura+ is an intelligent wellness tracking companion. It does not provide medical diagnoses or replace consultations with licensed healthcare providers.
                </div>
                <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#134E2F] accent-[#134E2F] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    I understand and agree to provide this information for my personal health profile.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    sessionStorage.removeItem('cura_just_registered');
                    if (user) {
                      const updated = { ...user, isOnboarded: true };
                      localStorage.setItem('cura_auth_user', JSON.stringify(updated));
                    }
                    navigate('/dashboard', { replace: true });
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl px-4 py-2 order-2 sm:order-1"
                >
                  I'll do this later (Go to Dashboard)
                </Button>

                <Button
                  onClick={handleNext}
                  className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-[#134E2F]/20 flex items-center gap-2 transition-transform active:scale-[0.99] order-1 sm:order-2 w-full sm:w-auto justify-center"
                >
                  <span>Begin Health Setup</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: BASIC PROFILE */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <User className="w-6 h-6 text-[#134E2F]" />
                  <span>Basic Profile</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tell us about your core demographic metrics so Cura+ can calibrate basic physiological baselines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDob(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Calculated Age */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Age <span className="text-[10px] text-slate-400 font-normal">(Automatically calculated)</span>
                  </label>
                  <div className="h-11 rounded-xl bg-slate-50 border border-slate-200 px-4 flex items-center text-sm font-black text-slate-800">
                    {calculatedAge > 0 ? `${calculatedAge} years old` : 'Enter date of birth'}
                  </div>
                </div>

                {/* Biological Sex */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Biological Sex <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBiologicalSex(s)}
                        className={cn(
                          "h-11 rounded-xl text-xs font-bold border capitalize transition-all",
                          biologicalSex === s
                            ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Identity (Optional) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gender Identity <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    value={genderIdentity}
                    onChange={(e) => setGenderIdentity(e.target.value)}
                    placeholder="e.g. Non-binary, Man, Woman"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Height</label>
                    <div className="flex items-center text-[10px] font-bold bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setHeightUnit('cm')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", heightUnit === 'cm' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeightUnit('ft')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", heightUnit === 'ft' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                      >
                        ft/in
                      </button>
                    </div>
                  </div>
                  {heightUnit === 'cm' ? (
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                      className="h-11 rounded-xl"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                        placeholder="5 ft"
                        className="h-11 rounded-xl"
                      />
                      <Input
                        type="number"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                        placeholder="9 in"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Weight</label>
                    <div className="flex items-center text-[10px] font-bold bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setWeightUnit('kg')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", weightUnit === 'kg' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeightUnit('lb')}
                        className={cn("px-2 py-0.5 rounded-md transition-all", weightUnit === 'lb' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
                      >
                        lb
                      </button>
                    </div>
                  </div>
                  {weightUnit === 'kg' ? (
                    <Input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      className="h-11 rounded-xl"
                    />
                  ) : (
                    <Input
                      type="number"
                      value={weightLb}
                      onChange={(e) => setWeightLb(e.target.value)}
                      placeholder="154"
                      className="h-11 rounded-xl"
                    />
                  )}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#134E2F]/20 cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Country</label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* State & City */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">State / Province</label>
                  <Input
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. California"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Real-time Body Mass Index Card (Requirement 3: strictly not a medical diagnosis) */}
              <div className="p-5 rounded-2xl bg-[#FAFDF4] border border-[#C1F3BA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C1F3BA] text-[#134E2F] flex items-center justify-center font-black shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Body Mass Index (BMI)
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">{bmiValue}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#C1F3BA] text-[#134E2F]">
                        {bmiCategory}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sm:max-w-xs text-[11px] text-slate-500 leading-snug">
                  * General health metric calculated from height and weight — <strong>not a medical diagnosis</strong>.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: CURRENT HEALTH STATUS / MEASUREMENTS */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#134E2F]" />
                  <span>Current Health Status</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Do you know your latest health measurements? Every metric is completely optional.
                </p>
              </div>

              {/* Progressive Question: Do you know your measurements? */}
              {knowsVitals === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setKnowsVitals(true)}
                    className="p-6 rounded-2xl border-2 border-slate-200 hover:border-[#134E2F] hover:bg-[#F2FBF1] transition-all text-left flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#C1F3BA]/40 text-[#134E2F] flex items-center justify-center font-bold shrink-0 group-hover:scale-105">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">Yes, I have recent measurements</h4>
                      <p className="text-xs text-slate-500 mt-1">Enter blood pressure, glucose, heart rate or temperature.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setKnowsVitals(false);
                      setBpSystolic('');
                      setBpDiastolic('');
                      setRestingHeartRate('');
                      setOxygenSaturation('');
                      setBloodGlucose('');
                      setBodyTemperature('');
                      handleNext();
                    }}
                    className="p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left flex items-start gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">I don't know / Skip this step</h4>
                      <p className="text-xs text-slate-500 mt-1">Skip without entering any vitals. You can record them anytime.</p>
                    </div>
                  </button>
                </div>
              )}

              {knowsVitals !== null && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-600 font-medium">Entering optional vitals snapshot</span>
                    <button
                      type="button"
                      onClick={() => {
                        setKnowsVitals(false);
                        setBpSystolic('');
                        setBpDiastolic('');
                        setRestingHeartRate('');
                        setOxygenSaturation('');
                        setBloodGlucose('');
                        setBodyTemperature('');
                      }}
                      className="text-[#134E2F] font-bold hover:underline"
                    >
                      Clear & Skip measurements
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Blood Pressure */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Blood Pressure (mmHg)
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input
                          type="number"
                          value={bpSystolic}
                          onChange={(e) => setBpSystolic(e.target.value)}
                          placeholder="Systolic (e.g. 120)"
                          className="h-10 rounded-xl text-xs"
                        />
                        <Input
                          type="number"
                          value={bpDiastolic}
                          onChange={(e) => setBpDiastolic(e.target.value)}
                          placeholder="Diastolic (e.g. 80)"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Typical target: 120/80 mmHg</span>
                    </div>

                    {/* Resting Heart Rate */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Resting Heart Rate (BPM)
                      </label>
                      <Input
                        type="number"
                        value={restingHeartRate}
                        onChange={(e) => setRestingHeartRate(e.target.value)}
                        placeholder="e.g. 72"
                        className="h-10 rounded-xl text-xs mt-2"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Typical target: 60–100 beats/min</span>
                    </div>

                    {/* Oxygen Saturation */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Blood Oxygen (SpO₂ %)
                      </label>
                      <Input
                        type="number"
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(e.target.value)}
                        placeholder="e.g. 98"
                        className="h-10 rounded-xl text-xs mt-2"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Typical target: 95%–100%</span>
                    </div>

                    {/* Blood Glucose */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Blood Glucose (mg/dL)</label>
                        <select
                          value={glucoseType}
                          onChange={(e) => setGlucoseType(e.target.value as any)}
                          className="text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50 cursor-pointer"
                        >
                          <option value="fasting">Fasting</option>
                          <option value="random">Random</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <Input
                        type="number"
                        value={bloodGlucose}
                        onChange={(e) => setBloodGlucose(e.target.value)}
                        placeholder="e.g. 90"
                        className="h-10 rounded-xl text-xs mt-2"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Fasting target: 70–99 mg/dL</span>
                    </div>

                    {/* Body Temperature */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white sm:col-span-2">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Body Temperature (°C)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={bodyTemperature}
                        onChange={(e) => setBodyTemperature(e.target.value)}
                        placeholder="e.g. 36.6"
                        className="h-10 rounded-xl text-xs mt-2 max-w-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Typical resting: 36.5°C – 37.5°C</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: MEDICAL CONDITIONS */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-6 h-6 text-[#134E2F]" />
                  <span>Current or Past Medical Conditions</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Have you ever been diagnosed with any medical condition? Select all that apply.
                </p>
              </div>

              {/* "No medical conditions" primary option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasMedicalConditions(false);
                    setSelectedConditions([]);
                    setConditionDetails({});
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between",
                    hasMedicalConditions === false
                      ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-xs font-extrabold">No previous medical conditions</span>
                  {hasMedicalConditions === false && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasMedicalConditions(true);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between",
                    hasMedicalConditions === true
                      ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-xs font-extrabold">Yes, I have past or current conditions</span>
                  {hasMedicalConditions === true && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Revealable Condition Badges */}
              {hasMedicalConditions === true && (
                <div className="space-y-4 pt-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    Select Diagnosed Conditions:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CONDITION_OPTIONS.map((cond) => {
                      const isSelected = selectedConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedConditions(prev => prev.filter(c => c !== cond));
                            } else {
                              setSelectedConditions(prev => [...prev, cond]);
                              if (!conditionDetails[cond]) {
                                setConditionDetails(prev => ({
                                  ...prev,
                                  [cond]: { yearDiagnosed: '', isActive: true, isReceivingTreatment: false, notes: '' }
                                }));
                              }
                            }
                          }}
                          className={cn(
                            "px-3.5 py-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between",
                            isSelected
                              ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <span className="truncate">{cond}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Contextual detailed questions for selected conditions */}
                  {selectedConditions.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Condition Details:
                      </span>
                      {selectedConditions.map((cond) => {
                        const details = conditionDetails[cond] || { yearDiagnosed: '', isActive: true, isReceivingTreatment: false, notes: '' };
                        return (
                          <div key={cond} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-extrabold text-[#134E2F]">{cond}</h4>
                              <span className="text-[10px] text-slate-400">Diagnosis Information</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">Year Diagnosed</label>
                                <Input
                                  value={details.yearDiagnosed}
                                  onChange={(e) => setConditionDetails(prev => ({
                                    ...prev,
                                    [cond]: { ...details, yearDiagnosed: e.target.value }
                                  }))}
                                  placeholder="e.g. 2021"
                                  className="h-9 rounded-lg text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">Is it currently active?</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setConditionDetails(prev => ({
                                      ...prev,
                                      [cond]: { ...details, isActive: true }
                                    }))}
                                    className={cn("h-9 rounded-lg text-xs font-bold border transition-all", details.isActive ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                                  >
                                    Active
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConditionDetails(prev => ({
                                      ...prev,
                                      [cond]: { ...details, isActive: false }
                                    }))}
                                    className={cn("h-9 rounded-lg text-xs font-bold border transition-all", !details.isActive ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                                  >
                                    Past / Inactive
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 block mb-1">Receiving Treatment?</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setConditionDetails(prev => ({
                                      ...prev,
                                      [cond]: { ...details, isReceivingTreatment: true }
                                    }))}
                                    className={cn("h-9 rounded-lg text-xs font-bold border transition-all", details.isReceivingTreatment ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConditionDetails(prev => ({
                                      ...prev,
                                      [cond]: { ...details, isReceivingTreatment: false }
                                    }))}
                                    className={cn("h-9 rounded-lg text-xs font-bold border transition-all", !details.isReceivingTreatment ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: SURGERIES & HOSPITALIZATION */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Scissors className="w-6 h-6 text-[#134E2F]" />
                  <span>Surgeries & Hospitalizations</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Have you ever had surgery or been hospitalized?
                </p>
              </div>

              {/* Binary Choice */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasSurgeries(false);
                    setSurgeriesList([]);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasSurgeries === false
                      ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span>No surgeries or hospitalizations</span>
                  {hasSurgeries === false && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasSurgeries(true);
                    if (surgeriesList.length === 0) {
                      setSurgeriesList([{ surgeryName: '', reason: '', year: '', duration: '', complications: '' }]);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasSurgeries === true
                      ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span>Yes, I have surgery records</span>
                  {hasSurgeries === true && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Multiple Records */}
              {hasSurgeries === true && (
                <div className="space-y-4 pt-2">
                  {surgeriesList.map((item, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#134E2F] uppercase tracking-wider">
                          Record #{index + 1}
                        </span>
                        {surgeriesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSurgeriesList(prev => prev.filter((_, i) => i !== index))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Procedure or Hospitalization Name <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            value={item.surgeryName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSurgeriesList(prev => prev.map((s, i) => i === index ? { ...s, surgeryName: val } : s));
                            }}
                            placeholder="e.g. Appendectomy, Knee Arthroscopy"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
                          <Input
                            value={item.reason}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSurgeriesList(prev => prev.map((s, i) => i === index ? { ...s, reason: val } : s));
                            }}
                            placeholder="e.g. Acute appendicitis"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Year</label>
                          <Input
                            value={item.year}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSurgeriesList(prev => prev.map((s, i) => i === index ? { ...s, year: val } : s));
                            }}
                            placeholder="e.g. 2018"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Hospitalization Duration (Optional)</label>
                          <Input
                            value={item.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSurgeriesList(prev => prev.map((s, i) => i === index ? { ...s, duration: val } : s));
                            }}
                            placeholder="e.g. 3 days"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Ongoing Effects or Complications (Optional)</label>
                          <Input
                            value={item.complications}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSurgeriesList(prev => prev.map((s, i) => i === index ? { ...s, complications: val } : s));
                            }}
                            placeholder="e.g. Occasional stiffness, full recovery"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSurgeriesList(prev => [...prev, { surgeryName: '', reason: '', year: '', duration: '', complications: '' }])}
                    className="w-full h-11 rounded-2xl border-dashed border-slate-300 hover:border-[#134E2F] hover:bg-[#F2FBF1] text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Another Surgery or Hospitalization</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: ALLERGIES & SENSITIVITIES */}
          {/* ======================================================== */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-[#134E2F]" />
                  <span>Allergies & Sensitivities</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Report known drug, dietary, and environmental allergies for clinical safety cross-checks.
                </p>
              </div>

              {/* SECTION A: MEDICATION ALLERGIES */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  1. Medication Allergies
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasMedAllergies(false);
                      setMedAllergiesList([]);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between",
                      hasMedAllergies === false ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    <span>No known drug allergies</span>
                    {hasMedAllergies === false && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasMedAllergies(true);
                      if (medAllergiesList.length === 0) setMedAllergiesList([{ name: '', reaction: '' }]);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between",
                      hasMedAllergies === true ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    <span>Yes, I have drug allergies</span>
                    {hasMedAllergies === true && <Check className="w-4 h-4" />}
                  </button>
                </div>

                {hasMedAllergies === true && (
                  <div className="space-y-3 pt-2">
                    {medAllergiesList.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMedAllergiesList(prev => prev.map((m, i) => i === idx ? { ...m, name: val } : m));
                          }}
                          placeholder="Medication name (e.g. Penicillin, Sulfa)"
                          className="h-9 rounded-lg text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.reaction}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedAllergiesList(prev => prev.map((m, i) => i === idx ? { ...m, reaction: val } : m));
                            }}
                            placeholder="Reaction (e.g. Hives, Anaphylaxis)"
                            className="h-9 rounded-lg text-xs flex-1"
                          />
                          {medAllergiesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setMedAllergiesList(prev => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMedAllergiesList(prev => [...prev, { name: '', reaction: '' }])}
                      className="text-xs font-bold rounded-xl h-9 border-dashed"
                    >
                      + Add another medication allergy
                    </Button>
                  </div>
                )}
              </div>

              {/* SECTION B: FOOD ALLERGIES */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  2. Food Allergies
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {FOOD_ALLERGY_OPTIONS.map((food) => {
                    const isSelected = selectedFoodAllergies.includes(food);
                    return (
                      <button
                        key={food}
                        type="button"
                        onClick={() => {
                          setSelectedFoodAllergies(prev =>
                            isSelected ? prev.filter(f => f !== food) : [...prev, food]
                          );
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between",
                          isSelected
                            ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span>{food}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION C: ENVIRONMENTAL ALLERGIES */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  3. Environmental Allergies
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ENV_ALLERGY_OPTIONS.map((env) => {
                    const isSelected = selectedEnvAllergies.includes(env);
                    return (
                      <button
                        key={env}
                        type="button"
                        onClick={() => {
                          setSelectedEnvAllergies(prev =>
                            isSelected ? prev.filter(e => e !== env) : [...prev, env]
                          );
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between",
                          isSelected
                            ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <span>{env}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 6: CURRENT MEDICATIONS & SUPPLEMENTS */}
          {/* ======================================================== */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Pill className="w-6 h-6 text-[#134E2F]" />
                  <span>Current Medications & Supplements</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Are you currently taking any prescription medications or dietary supplements?
                </p>
              </div>

              {/* Binary Question */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasMedications(false);
                    setMedicationsList([]);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasMedications === false ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                  )}
                >
                  <span>No medications or supplements</span>
                  {hasMedications === false && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasMedications(true);
                    if (medicationsList.length === 0) {
                      setMedicationsList([{ name: '', dosage: '', frequency: 'Once daily', reason: '', isPrescribed: true, startDate: '' }]);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasMedications === true ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                  )}
                >
                  <span>Yes, I take medications / supplements</span>
                  {hasMedications === true && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Multi-medication records */}
              {hasMedications === true && (
                <div className="space-y-4 pt-2">
                  {medicationsList.map((med, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#134E2F] uppercase tracking-wider">
                          Item #{idx + 1}
                        </span>
                        {medicationsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMedicationsList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Medication or Supplement Name <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            value={med.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, name: val } : m));
                            }}
                            placeholder="e.g. Metformin, Vitamin D3, Lisinopril"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Dosage (Optional)</label>
                          <Input
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, dosage: val } : m));
                            }}
                            placeholder="e.g. 500mg, 1000 IU"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Frequency</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, frequency: val } : m));
                            }}
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                          >
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="As needed">As needed (PRN)</option>
                            <option value="Weekly">Weekly</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Reason for taking</label>
                          <Input
                            value={med.reason}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, reason: val } : m));
                            }}
                            placeholder="e.g. Blood pressure, Bone health"
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, isPrescribed: true } : m))}
                              className={cn("h-10 rounded-xl text-xs font-bold border transition-all", med.isPrescribed ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                            >
                              Prescribed
                            </button>
                            <button
                              type="button"
                              onClick={() => setMedicationsList(prev => prev.map((m, i) => i === idx ? { ...m, isPrescribed: false } : m))}
                              className={cn("h-10 rounded-xl text-xs font-bold border transition-all", !med.isPrescribed ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200")}
                            >
                              Self-used / OTC
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMedicationsList(prev => [...prev, { name: '', dosage: '', frequency: 'Once daily', reason: '', isPrescribed: true, startDate: '' }])}
                    className="w-full h-11 rounded-2xl border-dashed border-slate-300 hover:border-[#134E2F] hover:bg-[#F2FBF1] text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Another Medication or Supplement</span>
                  </Button>
                </div>
              )}

              {/* Requirement 8: Explicit Safety Warning */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
                <span>
                  <strong>Clinical Safety Note:</strong> Cura+ records medications strictly for interaction alerts and schedule reminders. Cura+ will <strong>NEVER</strong> instruct you to start, stop, increase, or decrease any prescribed medication. Always follow your prescribing physician.
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 7: LIFESTYLE & DAILY HABITS */}
          {/* ======================================================== */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#134E2F]" />
                  <span>Lifestyle & Daily Habits</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Your daily routines help Cura+ calibrate energy expenditure, hydration targets, and sleep analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Physical Activity Level */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block mb-2">
                    Daily Physical Activity Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk work' },
                      { id: 'lightly_active', label: 'Lightly Active', desc: 'Light movement 1–2 days/week' },
                      { id: 'moderately_active', label: 'Moderately Active', desc: 'Moderate workout 3–4 days/week' },
                      { id: 'very_active', label: 'Very Active', desc: 'Heavy workout 5+ days/week' }
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setActivityLevel(lvl.id)}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all",
                          activityLevel === lvl.id
                            ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <h4 className="text-xs font-extrabold">{lvl.label}</h4>
                        <p className={cn("text-[10px] mt-1 leading-tight", activityLevel === lvl.id ? "text-white/80" : "text-slate-400")}>
                          {lvl.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise Frequency */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Exercise Frequency</label>
                  <select
                    value={exerciseFrequency}
                    onChange={(e) => setExerciseFrequency(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    <option value="Never">Never</option>
                    <option value="1–2 days/week">1–2 days/week</option>
                    <option value="3–4 days/week">3–4 days/week</option>
                    <option value="5+ days/week">5+ days/week</option>
                  </select>
                </div>

                {/* Sleep Hours & Quality */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">Average Sleep (Hours/Night)</label>
                    <span className="text-xs font-extrabold text-[#134E2F]">{sleepHours} hrs</span>
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    min="3"
                    max="16"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Diet */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Diet Preference</label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Non-vegetarian">Non-vegetarian</option>
                    <option value="Pescatarian">Pescatarian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Daily Water */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Approximate Daily Water (Liters)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(e.target.value)}
                    placeholder="2.5"
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Tobacco */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Tobacco Usage</label>
                  <select
                    value={smoking}
                    onChange={(e) => setSmoking(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    <option value="Never">Never</option>
                    <option value="Former">Former</option>
                    <option value="Current">Current</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Alcohol */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Alcohol Consumption</label>
                  <select
                    value={alcohol}
                    onChange={(e) => setAlcohol(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    <option value="Never">Never</option>
                    <option value="Occasionally">Occasionally</option>
                    <option value="Frequently">Frequently</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Stress Level (1 to 5 scale) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">
                      Stress Level (1 = Low / Calm, 5 = Very High)
                    </label>
                    <span className="text-xs font-black text-[#134E2F] px-2.5 py-0.5 rounded-full bg-[#C1F3BA]">
                      Level {stressLevel} / 5
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setStressLevel(level)}
                        className={cn(
                          "h-10 rounded-xl text-xs font-black border transition-all",
                          stressLevel === level
                            ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 8: FAMILY MEDICAL HISTORY */}
          {/* ======================================================== */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-[#134E2F]" />
                  <span>Family Medical History</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Does your close family have a history of major health conditions?
                </p>
              </div>

              {/* Critical Requirement 10: Explicit Disclaimer Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#134E2F]" />
                <span>
                  <strong>Genetic & Familial Context:</strong> This information is cataloged strictly as family predisposition context, <strong>NOT as your personal medical diagnosis</strong>.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasFamilyHistory(false);
                    setFamilyConditionsList([]);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasFamilyHistory === false ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                  )}
                >
                  <span>No known major family conditions</span>
                  {hasFamilyHistory === false && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHasFamilyHistory(true);
                    if (familyConditionsList.length === 0) {
                      setFamilyConditionsList([{ condition: 'Hypertension', relationship: 'Parent' }]);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-extrabold text-xs transition-all flex items-center justify-between",
                    hasFamilyHistory === true ? "bg-[#134E2F] text-white border-[#134E2F]" : "bg-white text-slate-700 border-slate-200"
                  )}
                >
                  <span>Yes, close family has health history</span>
                  {hasFamilyHistory === true && <Check className="w-4 h-4" />}
                </button>
              </div>

              {hasFamilyHistory === true && (
                <div className="space-y-4 pt-2">
                  {familyConditionsList.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Condition</label>
                        <select
                          value={item.condition}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFamilyConditionsList(prev => prev.map((f, i) => i === idx ? { ...f, condition: val } : f));
                          }}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                        >
                          {FAMILY_CONDITION_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Relationship</label>
                          <select
                            value={item.relationship}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFamilyConditionsList(prev => prev.map((f, i) => i === idx ? { ...f, relationship: val } : f));
                            }}
                            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                          >
                            <option value="Parent">Parent (Mother / Father)</option>
                            <option value="Sibling">Sibling (Brother / Sister)</option>
                            <option value="Grandparent">Grandparent</option>
                            <option value="Other relative">Other relative</option>
                          </select>
                        </div>
                        {familyConditionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFamilyConditionsList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500 mt-4 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFamilyConditionsList(prev => [...prev, { condition: 'Heart disease', relationship: 'Parent' }])}
                    className="w-full h-10 rounded-xl border-dashed text-xs font-bold"
                  >
                    + Add another family condition
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 9: HEALTH CONCERNS & GOALS */}
          {/* ======================================================== */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[#134E2F]" />
                  <span>Health Goals & Concerns</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  What would you like Cura+ to help you with? Select your primary wellness targets.
                </p>
              </div>

              {/* Goal Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = selectedGoals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGoals(prev =>
                          isSelected ? prev.filter(x => x !== g.id) : [...prev, g.id]
                        );
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3",
                        isSelected
                          ? "bg-[#134E2F] text-white border-[#134E2F] shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center border mt-0.5 shrink-0", isSelected ? "bg-white text-[#134E2F] border-white" : "border-slate-300")}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold">{g.label}</h4>
                        <p className={cn("text-[10px] mt-0.5", isSelected ? "text-white/80" : "text-slate-400")}>
                          {g.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Large Optional Health Concerns Box (Requirement 11) */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Do you currently have any specific health concerns you'd like Cura+ to know about? (Optional)
                </label>
                <textarea
                  value={healthConcerns}
                  onChange={(e) => setHealthConcerns(e.target.value)}
                  placeholder="e.g. Occasional afternoon energy slumps, recovering from a recent sprain, sensitive stomach with dairy..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#134E2F]/20 resize-none"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 10: EMERGENCY CONTACT & PRE-GENERATION REVIEW */}
          {/* ======================================================== */}
          {step === 10 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-[#134E2F]" />
                  <span>Emergency Contact & Final Review</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Provide an emergency contact and verify your health profile before generating your initial summary.
                </p>
              </div>

              {/* Optional Emergency Contact Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Emergency Contact (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contact Name</label>
                    <Input
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Michael Vance"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                    <Input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                    <select
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                    >
                      <option value="Spouse / Partner">Spouse / Partner</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pre-Generation Profile Review Summary (Requirement 12) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Profile Summary Review
                  </h3>
                  <span className="text-xs text-slate-400">Click Edit on any card to update</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Basic Profile */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">1. Basic Info</span>
                        <button type="button" onClick={() => setStep(1)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">{fullName || 'User'}, {calculatedAge} yrs ({biologicalSex})</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{activeHeightCm} cm • {activeWeightKg} kg • Blood {bloodGroup}</p>
                      <p className="text-[11px] text-[#134E2F] font-bold mt-1">BMI: {bmiValue} ({bmiCategory})</p>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">2. Vitals Snapshot</span>
                        <button type="button" onClick={() => setStep(2)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {bpSystolic && bpDiastolic ? `BP: ${bpSystolic}/${bpDiastolic} mmHg` : 'BP: Skipped'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        HR: {restingHeartRate || '--'} bpm • SpO₂: {oxygenSaturation || '--'}% • Glucose: {bloodGlucose || '--'} mg/dL
                      </p>
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">3. Medical Conditions</span>
                        <button type="button" onClick={() => setStep(3)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {selectedConditions.length > 0 ? selectedConditions.join(', ') : 'None reported'}
                      </p>
                    </div>
                  </div>

                  {/* Surgeries */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">4. Surgeries</span>
                        <button type="button" onClick={() => setStep(4)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {surgeriesList.filter(s => s.surgeryName).length > 0
                          ? surgeriesList.filter(s => s.surgeryName).map(s => s.surgeryName).join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">5. Allergies</span>
                        <button type="button" onClick={() => setStep(5)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        Food: {selectedFoodAllergies.length > 0 ? selectedFoodAllergies.join(', ') : 'None'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Drugs: {medAllergiesList.filter(m => m.name).map(m => m.name).join(', ') || 'None'}
                      </p>
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">6. Medications</span>
                        <button type="button" onClick={() => setStep(6)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {medicationsList.filter(m => m.name).length > 0
                          ? medicationsList.filter(m => m.name).map(m => m.name).join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>

                  {/* Lifestyle */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">7. Lifestyle</span>
                        <button type="button" onClick={() => setStep(7)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {exerciseFrequency} • Sleep: {sleepHours}h ({sleepQuality})
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Diet: {dietType} • Water: {waterIntake}L • Stress Level {stressLevel}/5
                      </p>
                    </div>
                  </div>

                  {/* Family History */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase">8. Family History</span>
                        <button type="button" onClick={() => setStep(8)} className="text-[#134E2F] hover:underline text-xs font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 mt-2">
                        {familyConditionsList.length > 0
                          ? familyConditionsList.map(f => `${f.condition} (${f.relationship})`).join(', ')
                          : 'None reported'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 11: HEALTH PROFILE GENERATION & INITIAL HEALTH SUMMARY */}
          {/* ======================================================== */}
          {step === 11 && (
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#C1F3BA] text-[#134E2F] flex items-center justify-center font-black mx-auto mb-4 shadow-lg shadow-[#C1F3BA]/40">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Your health profile is ready.
                </h1>
                <p className="text-sm text-slate-600 mt-2">
                  Based on the information you've provided, here is your clinical baseline and initial wellness summary.
                </p>
              </div>

              {/* SNAPSHOT TILES (Requirement 13) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#134E2F]" />
                  <span>Current Health Snapshot</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Age</span>
                    <span className="text-lg font-black text-slate-900">{calculatedAge} yrs</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">BMI</span>
                    <span className="text-lg font-black text-[#134E2F]">{bmiValue}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                    <span className="text-lg font-black text-slate-900">
                      {bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : 'Not set'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Resting HR</span>
                    <span className="text-lg font-black text-slate-900">{restingHeartRate ? `${restingHeartRate} bpm` : '--'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Oxygen</span>
                    <span className="text-lg font-black text-slate-900">{oxygenSaturation ? `${oxygenSaturation}%` : '--'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Glucose</span>
                    <span className="text-lg font-black text-slate-900">{bloodGlucose ? `${bloodGlucose} mg/dL` : '--'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Weight</span>
                    <span className="text-lg font-black text-slate-900">{activeWeightKg} kg</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sleep Baseline</span>
                    <span className="text-lg font-black text-slate-900">{sleepHours} hrs/night</span>
                  </div>
                </div>
              </div>

              {/* INITIAL HEALTH SUMMARY: SEPARATED INTO THREE PILLARS (Requirement 14) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#134E2F]" />
                  <span>Initial Health Wellness Summary</span>
                </h3>

                {/* 1. Positive Indicators */}
                {healthInsights.positives.length > 0 && (
                  <div className="p-5 rounded-2xl bg-[#EAF8E7] border border-[#C1F3BA] space-y-2">
                    <h4 className="text-xs font-black text-[#134E2F] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#134E2F]" />
                      <span>Positive Indicators</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {healthInsights.positives.map((pos, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#134E2F] font-bold">•</span>
                          <span>{pos}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Things to Monitor */}
                {healthInsights.monitor.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Things to Monitor</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-amber-950">
                      {healthInsights.monitor.map((mon, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{mon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. General Wellness Suggestions */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#134E2F]" />
                    <span>General Wellness Suggestions</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {healthInsights.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#134E2F] font-bold">✓</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirement 14: Non-diagnostic medical disclaimer */}
                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/60 text-[11px] text-slate-500 italic leading-relaxed">
                  * Clinical Disclaimer: This summary is generated solely from your self-reported responses and is intended for general wellness and educational tracking. It does not constitute a clinical diagnosis, medical evaluation, or treatment plan. Always consult a licensed healthcare professional for clinical advice.
                </div>
              </div>

              {/* Enter Dashboard Button */}
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-extrabold text-sm h-12 px-10 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center gap-2 transition-transform active:scale-[0.99]"
                >
                  <span>Enter Cura+ Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Controls (Steps 1 through 10) */}
          {step > 0 && step <= 10 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="rounded-2xl border-slate-200 h-11 px-5 font-bold text-xs flex items-center gap-2 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Go Back</span>
              </Button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveProgress(false)}
                  className="text-xs font-bold text-slate-500 hover:text-[#134E2F] px-3 py-2 transition-colors hidden sm:block"
                >
                  Save & Continue Later
                </button>

                {step < 10 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold h-11 px-7 rounded-2xl shadow-md shadow-[#134E2F]/20 flex items-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFinalConfirm}
                    disabled={isSubmitting}
                    className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-black h-11 px-8 rounded-2xl shadow-xl shadow-[#134E2F]/20 flex items-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Health Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Generate Profile</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

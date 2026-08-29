import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft, 
  User, Heart, Activity, Target, Phone, Sparkles, Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Step 1: Personal
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState<string>('26');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');

  // Step 2: Lifestyle
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  const [sleepHours, setSleepHours] = useState('7-8 hours');
  const [waterIntake, setWaterIntake] = useState('2.5 Liters');
  const [smoking, setSmoking] = useState('non_smoker');
  const [alcohol, setAlcohol] = useState('occasional');

  // Step 3: Medical
  const [bloodType, setBloodType] = useState('O+');
  const [allergiesList, setAllergiesList] = useState<string[]>(['None']);
  const [customAllergy, setCustomAllergy] = useState('');
  const [medicalConditionsList, setMedicalConditionsList] = useState<string[]>(['None']);
  const [customCondition, setCustomCondition] = useState('');
  const [medications, setMedications] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');

  // Step 4: Health Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['stay_healthy']);

  // Step 5: Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');

  // BMI helper
  const hNum = Number(height) || 0;
  const wNum = Number(weight) || 0;
  const bmiCalc = hNum > 0 ? (wNum / ((hNum / 100) * (hNum / 100))).toFixed(1) : '0.0';

  const goalOptions = [
    { id: 'lose_weight', label: 'Lose Weight', desc: 'Shed excess fat & optimize caloric deficit' },
    { id: 'gain_weight', label: 'Gain Weight / Muscle', desc: 'Build lean body mass and protein intake' },
    { id: 'stay_healthy', label: 'Stay Healthy & Fit', desc: 'Maintain vitality, immunity and balanced wellness' },
    { id: 'improve_sleep', label: 'Improve Sleep Quality', desc: 'Fix circadian rhythm and deep restorative rest' },
    { id: 'diabetes_control', label: 'Diabetes & Glycemic Control', desc: 'Monitor carbs and prevent blood glucose spikes' },
    { id: 'heart_health', label: 'Heart & Cardio Health', desc: 'Lower blood pressure and improve endurance' },
  ];

  const commonAllergies = ['Peanuts', 'Tree nuts', 'Shellfish', 'Dairy / Lactose', 'Gluten / Wheat', 'Soy', 'Eggs', 'Fish', 'None'];
  const commonConditions = ['Asthma', 'Hypertension', 'Type 1 Diabetes', 'Type 2 Diabetes', 'High Cholesterol', 'Thyroid', 'None'];

  const toggleAllergy = (item: string) => {
    if (item === 'None') {
      setAllergiesList(['None']);
      return;
    }
    const filtered = allergiesList.filter(a => a !== 'None');
    if (filtered.includes(item)) {
      const next = filtered.filter(a => a !== item);
      setAllergiesList(next.length === 0 ? ['None'] : next);
    } else {
      setAllergiesList([...filtered, item]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim()) {
      const filtered = allergiesList.filter(a => a !== 'None');
      if (!filtered.includes(customAllergy.trim())) {
        setAllergiesList([...filtered, customAllergy.trim()]);
      }
      setCustomAllergy('');
    }
  };

  const toggleCondition = (item: string) => {
    if (item === 'None') {
      setMedicalConditionsList(['None']);
      return;
    }
    const filtered = medicalConditionsList.filter(c => c !== 'None');
    if (filtered.includes(item)) {
      const next = filtered.filter(c => c !== item);
      setMedicalConditionsList(next.length === 0 ? ['None'] : next);
    } else {
      setMedicalConditionsList([...filtered, item]);
    }
  };

  const addCustomCondition = () => {
    if (customCondition.trim()) {
      const filtered = medicalConditionsList.filter(c => c !== 'None');
      if (!filtered.includes(customCondition.trim())) {
        setMedicalConditionsList([...filtered, customCondition.trim()]);
      }
      setCustomCondition('');
    }
  };

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== goalId));
      }
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const validateStep = () => {
    setFormError(null);
    if (step === 1) {
      if (!name.trim()) {
        setFormError('Please enter your full name.');
        return false;
      }
      if (!age || Number(age) < 5 || Number(age) > 120) {
        setFormError('Please enter a valid age.');
        return false;
      }
      if (!height || Number(height) < 50 || Number(height) > 260) {
        setFormError('Please enter a valid height in cm.');
        return false;
      }
      if (!weight || Number(weight) < 20 || Number(weight) > 300) {
        setFormError('Please enter a valid weight in kg.');
        return false;
      }
    }
    if (step === 4) {
      if (selectedGoals.length === 0) {
        setFormError('Please select at least one health goal.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, 5));
    }
  };

  const handlePrev = () => {
    setFormError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const cleanAllergies = allergiesList.filter(a => a !== 'None');
      const cleanConditions = medicalConditionsList.filter(c => c !== 'None');

      const payload = {
        name: name.trim(),
        age: Number(age),
        gender,
        heightCm: Number(height),
        weightKg: Number(weight),
        activityLevel,
        sleepHours,
        waterIntake,
        smoking,
        alcohol,
        bloodType,
        allergies: cleanAllergies,
        medicalConditions: cleanConditions,
        medications: medications.trim(),
        familyHistory: familyHistory.trim(),
        healthGoals: selectedGoals,
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: emergencyRelation,
        },
      };

      const success = await completeOnboarding(payload);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setFormError('Failed to save profile. Please review your information.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving your onboarding details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Lifestyle', icon: Activity },
    { num: 3, label: 'Medical', icon: Heart },
    { num: 4, label: 'Goals', icon: Target },
    { num: 5, label: 'Emergency', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Clinical Onboarding Wizard</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl border border-slate-200/70 rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-10">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Build Your Clinical Health Profile
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Step {step} of 5 — Cura+ customizes your daily health metrics, targets, and allergy guard.
            </p>
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Stepper Progress Indicator */}
          <div className="mb-8 relative">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -z-10 -translate-y-1/2" />
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />

              {stepLabels.map((s) => {
                const Icon = s.icon;
                const isCompleted = step > s.num;
                const isCurrent = step === s.num;

                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm border",
                      isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                      isCurrent ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100" :
                      "bg-white border-slate-200 text-slate-400"
                    )}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium mt-1.5 hidden sm:block",
                      isCurrent ? "text-blue-600 font-semibold" : "text-slate-400"
                    )}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Wizard Pages */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <motion.div 
                  key="step1" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-800">1. Personal Information</h2>
                    <p className="text-xs text-slate-500">Accurate stats ensure clinically valid BMI and metabolic metrics.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Elena Vance" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Age</label>
                        <Input 
                          type="number" 
                          min={5} 
                          max={120} 
                          value={age} 
                          onChange={(e) => setAge(e.target.value)} 
                          placeholder="26"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Biological Gender</label>
                        <select 
                          value={gender} 
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other / Non-binary</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Height (cm)</label>
                        <Input 
                          type="number" 
                          min={50} 
                          max={260} 
                          value={height} 
                          onChange={(e) => setHeight(e.target.value)} 
                          placeholder="175"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Weight (kg)</label>
                        <Input 
                          type="number" 
                          min={20} 
                          max={300} 
                          value={weight} 
                          onChange={(e) => setWeight(e.target.value)} 
                          placeholder="72"
                          required
                        />
                      </div>
                    </div>

                    {/* Live BMI badge */}
                    <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">Calculated Body Mass Index (BMI): </span>
                        <span className="font-bold text-blue-600">{bmiCalc}</span>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {Number(bmiCalc) < 18.5 ? 'Underweight' : Number(bmiCalc) < 25 ? 'Normal BMI' : Number(bmiCalc) < 30 ? 'Overweight' : 'Obese'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Lifestyle */}
              {step === 2 && (
                <motion.div 
                  key="step2" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-800">2. Daily Lifestyle & Habits</h2>
                    <p className="text-xs text-slate-500">Helps calibrate your daily hydration targets and basal metabolic rate.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Physical Activity Level</label>
                      <select 
                        value={activityLevel} 
                        onChange={(e) => setActivityLevel(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sedentary">Sedentary (Desk job, minimal exercise)</option>
                        <option value="lightly_active">Lightly Active (1-3 workout days/week)</option>
                        <option value="moderately_active">Moderately Active (3-5 moderate workouts/week)</option>
                        <option value="very_active">Very Active (6-7 intense workout days/week)</option>
                        <option value="extremely_active">Extremely Active (Athletic training/physical labor)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Target Sleep Duration</label>
                        <select 
                          value={sleepHours} 
                          onChange={(e) => setSleepHours(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="6-7 hours">6 - 7 hours</option>
                          <option value="7-8 hours">7 - 8 hours (Recommended)</option>
                          <option value="8-9 hours">8 - 9 hours</option>
                          <option value="9+ hours">9+ hours</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Hydration Target</label>
                        <select 
                          value={waterIntake} 
                          onChange={(e) => setWaterIntake(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1.5 - 2 Liters">1.5 - 2.0 Liters</option>
                          <option value="2.5 Liters">2.5 Liters (Standard)</option>
                          <option value="3.0 Liters">3.0 Liters</option>
                          <option value="3.5+ Liters">3.5+ Liters (High activity)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Smoking Status</label>
                        <select 
                          value={smoking} 
                          onChange={(e) => setSmoking(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="non_smoker">Non-smoker</option>
                          <option value="occasional">Occasional</option>
                          <option value="regular">Regular smoker</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Alcohol Consumption</label>
                        <select 
                          value={alcohol} 
                          onChange={(e) => setAlcohol(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="none">None / Non-drinker</option>
                          <option value="occasional">Occasional (Socially)</option>
                          <option value="moderate">Moderate (1-2 drinks/week)</option>
                          <option value="frequent">Frequent (3+ drinks/week)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Medical Information */}
              {step === 3 && (
                <motion.div 
                  key="step3" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-800">3. Medical Profile & Allergen Shield</h2>
                    <p className="text-xs text-slate-500">Cura+ food scanner uses these records to warn against dangerous allergens.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Blood Group</label>
                      <select 
                        value={bloodType} 
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                      </select>
                    </div>

                    {/* Allergies tag pills */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Known Food Allergies</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {commonAllergies.map(allergy => {
                          const isSelected = allergiesList.includes(allergy);
                          return (
                            <button
                              key={allergy}
                              type="button"
                              onClick={() => toggleAllergy(allergy)}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                                isSelected 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-sm" 
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {allergy}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add custom allergy..." 
                          value={customAllergy} 
                          onChange={(e) => setCustomAllergy(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(); }}}
                          className="text-xs h-8"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={addCustomAllergy}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Existing Medical Conditions */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Existing Medical Conditions</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {commonConditions.map(cond => {
                          const isSelected = medicalConditionsList.includes(cond);
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => toggleCondition(cond)}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                                isSelected 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {cond}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add custom condition..." 
                          value={customCondition} 
                          onChange={(e) => setCustomCondition(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCondition(); }}}
                          className="text-xs h-8"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={addCustomCondition}>
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Current Active Medications (Optional)</label>
                      <Input 
                        placeholder="e.g. Metformin 500mg, Multivitamin (comma separated)" 
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Family Medical History (Optional)</label>
                      <Input 
                        placeholder="e.g. Family history of hypertension, cardiovascular conditions" 
                        value={familyHistory}
                        onChange={(e) => setFamilyHistory(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Goals */}
              {step === 4 && (
                <motion.div 
                  key="step4" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-800">4. Select Your Health Goals</h2>
                    <p className="text-xs text-slate-500">Pick one or more goals to tailor AI insights and nutrition recommendations.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {goalOptions.map(g => {
                      const isSelected = selectedGoals.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer select-none",
                            isSelected 
                              ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm" 
                              : "bg-white border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn("text-xs font-bold", isSelected ? "text-blue-900" : "text-slate-800")}>
                              {g.label}
                            </h3>
                            <div className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center border",
                              isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                            )}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500">{g.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Emergency Contact */}
              {step === 5 && (
                <motion.div 
                  key="step5" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-800">5. Emergency Contact Information</h2>
                    <p className="text-xs text-slate-500">Essential contact record for clinical summaries and health passport.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Emergency Contact Name</label>
                      <Input 
                        placeholder="e.g. John Doe" 
                        value={emergencyName} 
                        onChange={(e) => setEmergencyName(e.target.value)} 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                        <Input 
                          placeholder="+1 (555) 019-2834" 
                          value={emergencyPhone} 
                          onChange={(e) => setEmergencyPhone(e.target.value)} 
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Relationship</label>
                        <select 
                          value={emergencyRelation} 
                          onChange={(e) => setEmergencyRelation(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Privacy notice */}
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-start gap-3 mt-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        By completing this onboarding, your health profile, calorie targets, and allergen safeguards are securely created and linked to your account.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrev}
                  className="flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              ) : <div />}

              {step < 5 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 px-6"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white flex items-center gap-2 px-8 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Launch Dashboard</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

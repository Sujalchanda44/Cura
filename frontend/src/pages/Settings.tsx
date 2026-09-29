import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, Activity, Globe, Moon, Sun, Loader2, Camera,
  HeartPulse, Scale, ShieldAlert, Plus, X, Check, Utensils
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserProfile, updateUserProfile, updateHealthProfile } from '@/api/userApi';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import { AvatarUploadModal } from '@/components/AvatarUploadModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'health';

  const { user, updateUser: updateUserContext, refreshProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states - Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Form states - Health Profile & Biometrics
  const [heightCm, setHeightCm] = useState('165');
  const [weightKg, setWeightKg] = useState('50');
  const [bloodType, setBloodType] = useState('O+');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [dietType, setDietType] = useState('non-vegetarian');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [medications, setMedications] = useState('');

  // Medical conditions & Allergies
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [newConditionInput, setNewConditionInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['health', 'account', 'preferences'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'health', label: 'Health Profile & Biometrics', icon: HeartPulse },
    { id: 'account', label: t('settings.tab.account', 'Account'), icon: User },
    { id: 'preferences', label: t('settings.tab.preferences', 'Preferences'), icon: Activity },
  ];

  // Calculated BMI and category preview
  const calculatedBmi = useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0) return null;
    const val = Number((w / (h * h)).toFixed(1));
    let category = 'Normal';
    let colorClass = 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40';

    if (val < 18.5) {
      category = 'Underweight';
      colorClass = 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40';
    } else if (val < 25) {
      category = 'Healthy';
      colorClass = 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40';
    } else if (val < 30) {
      category = 'Overweight';
      colorClass = 'text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40';
    } else {
      category = 'Obese';
      colorClass = 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40';
    }
    return { val, category, colorClass };
  }, [heightCm, weightKg]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data) {
          setName(data.name || '');
          setEmail(data.email || '');

          const hp = data.healthProfile || {};
          if (hp.heightCm) setHeightCm(String(hp.heightCm));
          if (hp.weightKg) setWeightKg(String(hp.weightKg));
          if (hp.bloodType || hp.bloodGroup) setBloodType(hp.bloodType || hp.bloodGroup);
          if (hp.age) setAge(String(hp.age));
          if (hp.gender) setGender(hp.gender);
          if (hp.activityLevel) setActivityLevel(hp.activityLevel);
          if (hp.dietType) setDietType(hp.dietType);
          if (Array.isArray(hp.medicalConditions)) setMedicalConditions(hp.medicalConditions);
          if (Array.isArray(hp.allergies)) setAllergies(hp.allergies);
          if (hp.medications) {
            setMedications(typeof hp.medications === 'string' ? hp.medications : JSON.stringify(hp.medications));
          }
        }
      } catch (error) {
        console.error('Error loading settings profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Add / remove conditions
  const handleAddCondition = (cond: string) => {
    const trimmed = cond.trim();
    if (!trimmed || medicalConditions.includes(trimmed)) return;
    setMedicalConditions([...medicalConditions, trimmed]);
    setNewConditionInput('');
  };

  const handleRemoveCondition = (cond: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== cond));
  };

  // Add / remove allergies
  const handleAddAllergy = (alg: string) => {
    const trimmed = alg.trim();
    if (!trimmed || allergies.includes(trimmed)) return;
    setAllergies([...allergies, trimmed]);
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (alg: string) => {
    setAllergies(allergies.filter(a => a !== alg));
  };

  // Save Health Profile
  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHealth(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const parsedHeight = parseFloat(heightCm);
      const parsedWeight = parseFloat(weightKg);
      const parsedAge = parseInt(age, 10);

      if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 280) {
        throw new Error('Please enter a valid height between 50 cm and 280 cm.');
      }
      if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 400) {
        throw new Error('Please enter a valid weight between 20 kg and 400 kg.');
      }

      await updateHealthProfile({
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        bloodType,
        age: !isNaN(parsedAge) ? parsedAge : 25,
        gender,
        activityLevel,
        dietType,
        medicalConditions,
        allergies,
        medications
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      setSuccessMsg('Health profile and biometrics saved successfully! Your BMI and Food Scanner rules have updated.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update health profile.');
    } finally {
      setIsSavingHealth(false);
    }
  };

  // Save Account
  const handleSaveAccount = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await updateUserProfile({ name });
      if (response) {
        await updateUserContext({ name: response.name });
        setSuccessMsg(t('settings.accountSaved', 'Account details saved successfully.'));
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to update account.');
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#134E2F] dark:text-[#C1F3BA]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your health profile, biometrics, preferences, and account security.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl text-sm transition-colors flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-2xl text-sm transition-colors flex items-center gap-2 shadow-xs">
          <X className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center px-3.5 py-2.5 text-sm font-bold rounded-2xl whitespace-nowrap transition-colors cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#C1F3BA] text-[#134E2F] dark:text-[#0A0E08] shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2318]"
                )}
              >
                <tab.icon className={cn("mr-2.5 h-4 w-4", activeTab === tab.id ? "text-[#134E2F] dark:text-[#0A0E08]" : "text-slate-400 dark:text-slate-500")} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <div className="flex-1 space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: HEALTH PROFILE & BIOMETRICS (MAIN EDITING SUITE)   */}
          {/* ========================================================= */}
          {activeTab === 'health' && (
            <form onSubmit={handleSaveHealthProfile} className="space-y-6">
              
              {/* Card 1: Biometrics & Core Vitals */}
              <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Scale className="w-5 h-5 text-[#134E2F] dark:text-[#C1F3BA]" />
                        Biometric Telemetry & Physical Stats
                      </CardTitle>
                      <CardDescription>
                        Update your physical measurements to keep your BMI, caloric targets, and clinical insights accurate.
                      </CardDescription>
                    </div>
                    {calculatedBmi && (
                      <div className={cn("px-3 py-1 rounded-2xl border text-xs font-bold flex items-center gap-1.5", calculatedBmi.colorClass)}>
                        <span>BMI: {calculatedBmi.val}</span>
                        <span>•</span>
                        <span>{calculatedBmi.category}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Height (cm)
                      </label>
                      <Input
                        type="number"
                        min="50"
                        max="280"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="e.g. 165"
                        required
                        className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Weight (kg)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="20"
                        max="400"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="e.g. 50"
                        required
                        className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Blood Type
                      </label>
                      <select
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Age
                      </label>
                      <Input
                        type="number"
                        min="10"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 25"
                        required
                        className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Biological Sex / Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Activity Level
                      </label>
                      <select
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                      >
                        <option value="sedentary">Sedentary (Little or no exercise)</option>
                        <option value="light">Light (Exercise 1-3 days/week)</option>
                        <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                        <option value="active">Active (Hard exercise 6-7 days/week)</option>
                        <option value="very_active">Very Active (Physical job or athlete)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Medical Conditions */}
              <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Medical Conditions & Health Concerns
                  </CardTitle>
                  <CardDescription>
                    Add or remove active medical conditions so Cura+ AI can tailor health recommendations and meal safety warnings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Active Condition Badges */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Registered Conditions ({medicalConditions.length}):
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1C2318] border border-slate-100 dark:border-[#273322]">
                      {medicalConditions.length > 0 ? (
                        medicalConditions.map((cond, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#151A12] border border-slate-200 dark:border-[#273322] text-slate-800 dark:text-slate-200 shadow-2xs"
                          >
                            <span>{cond}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCondition(cond)}
                              className="text-slate-400 hover:text-red-500 rounded-full cursor-pointer"
                              title="Remove condition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 self-center">No conditions registered. Add below if applicable.</span>
                      )}
                    </div>
                  </div>

                  {/* Add Condition Input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newConditionInput}
                      onChange={(e) => setNewConditionInput(e.target.value)}
                      placeholder="Type condition (e.g. Hypertension, Thyroid)..."
                      className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCondition(newConditionInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddCondition(newConditionInput)}
                      disabled={!newConditionInput.trim()}
                      className="rounded-xl shrink-0 font-bold"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  {/* Quick-add chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Common Conditions (Tap to add):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Diabetes', 'Hypertension', 'Thyroid', 'Asthma', 'PCOS/PCOD', 'High Cholesterol', 'Acid Reflux'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddCondition(item)}
                          disabled={medicalConditions.includes(item)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                            medicalConditions.includes(item)
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-50"
                              : "bg-white dark:bg-[#1C2318] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#273322] hover:border-emerald-500"
                          )}
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Food Allergies & AI Scanner Shield */}
              <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    Food Allergies & Safety Shield
                  </CardTitle>
                  <CardDescription>
                    The AI Food Scanner checks each food item you photograph against this exact list.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Active Allergy Badges */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Protected Allergens ({allergies.length}):
                    </label>
                    <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50">
                      {allergies.length > 0 ? (
                        allergies.map((alg, i) => (
                          <Badge
                            key={i}
                            variant="destructive"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900 shadow-2xs"
                          >
                            <span>⚠️ {alg}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergy(alg)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 rounded-full cursor-pointer ml-1"
                              title="Remove allergen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 self-center font-medium">
                          No allergies registered. Universal food safety enabled.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Allergy Input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newAllergyInput}
                      onChange={(e) => setNewAllergyInput(e.target.value)}
                      placeholder="Type allergen (e.g. Peanuts, Dairy, Gluten)..."
                      className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy(newAllergyInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddAllergy(newAllergyInput)}
                      disabled={!newAllergyInput.trim()}
                      className="rounded-xl shrink-0 font-bold"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  {/* Quick-add chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Common Food Allergens (Tap to add):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Peanuts', 'Dairy / Milk', 'Gluten / Wheat', 'Soy', 'Shellfish', 'Eggs', 'Tree Nuts', 'Fish'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddAllergy(item)}
                          disabled={allergies.includes(item)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                            allergies.includes(item)
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-50"
                              : "bg-white dark:bg-[#1C2318] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#273322] hover:border-red-400"
                          )}
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Dietary Preferences & Medications */}
              <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-[#134E2F] dark:text-[#C1F3BA]" />
                    Dietary Lifestyle & Medications
                  </CardTitle>
                  <CardDescription>
                    Configure your daily dietary habits and medications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Dietary Preference
                      </label>
                      <select
                        value={dietType}
                        onChange={(e) => setDietType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                      >
                        <option value="vegetarian">Vegetarian</option>
                        <option value="non-vegetarian">Non-Vegetarian</option>
                        <option value="vegan">Vegan</option>
                        <option value="eggetarian">Eggetarian</option>
                        <option value="jain">Jain (No Root Vegetables)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Current Medications & Supplements
                      </label>
                      <Input
                        type="text"
                        value={medications}
                        onChange={(e) => setMedications(e.target.value)}
                        placeholder="e.g. Metformin 500mg, Vitamin D3..."
                        className="rounded-xl bg-white dark:bg-[#1C2318] border-slate-200 dark:border-[#273322] text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSavingHealth}
                  className="bg-[#134E2F] hover:bg-[#0E3B24] text-white font-bold rounded-2xl px-8 h-12 shadow-md shadow-[#134E2F]/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  {isSavingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  <span>{isSavingHealth ? 'Saving Health Profile...' : 'Save Health Profile'}</span>
                </Button>
              </div>

            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ACCOUNT INFORMATION                                */}
          {/* ========================================================= */}
          {activeTab === 'account' && (
            <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your basic account details and profile photo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Profile Picture (DP) Section */}
                <div className="flex items-center space-x-4 pb-3 border-b border-slate-100 dark:border-[#273322]">
                  <div className="relative group">
                    <div 
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 dark:bg-[#1C2318] border-2 border-white dark:border-[#273322] shadow-sm cursor-pointer relative"
                      title="Upload profile picture (Laptop or Phone)"
                    >
                      <img 
                        src={getAvatarUrl(user?.avatarUrl, name)} 
                        alt="Profile avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#134E2F] hover:bg-[#0E3B24] text-white flex items-center justify-center shadow-xs border border-white dark:border-[#151A12] cursor-pointer"
                      title="Change photo"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile Picture</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Upload from laptop files or snap with phone camera</p>
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="inline-flex items-center text-xs font-semibold text-[#134E2F] dark:text-[#C1F3BA] bg-[#F2FBF1] dark:bg-[#1C2318] hover:bg-[#E4F8E2] dark:hover:bg-[#273322] px-3 py-1 rounded-full transition-colors border border-[#C1F3BA]/60 dark:border-[#273322] cursor-pointer"
                    >
                      <Camera className="h-3 w-3 mr-1.5" />
                      Upload New Photo
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full md:max-w-md rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#134E2F] transition-colors" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    className="flex h-10 w-full md:max-w-md rounded-xl border border-slate-200 dark:border-[#273322] bg-slate-100 dark:bg-[#151A12] px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed transition-colors" 
                    value={email} 
                    disabled 
                  />
                </div>
                <Button onClick={handleSaveAccount} disabled={isSaving} className="mt-2 bg-[#134E2F] hover:bg-[#0E3B24] rounded-xl text-white font-bold">
                  {isSaving ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ========================================================= */}
          {/* TAB 3: APP PREFERENCES                                    */}
          {/* ========================================================= */}
          {activeTab === 'preferences' && (
            <Card className="shadow-xs border border-slate-200/80 dark:border-[#273322] rounded-3xl bg-white/95 dark:bg-[#151A12]">
              <CardHeader>
                <CardTitle>{t('settings.appPreferences', 'App Preferences')}</CardTitle>
                <CardDescription>{t('settings.appPreferencesDesc', 'Customize your Cura+ experience.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Working Dark Mode Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#273322]">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      {isDark ? (
                        <Sun className="mr-2 h-4 w-4 text-amber-400" />
                      ) : (
                        <Moon className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                      )}
                      {t('settings.darkMode', 'Dark Mode')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('settings.darkModeDesc', 'Toggle dark appearance across the application.')}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    onClick={toggleTheme}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#134E2F]",
                      isDark ? "bg-[#134E2F] dark:bg-[#C1F3BA]" : "bg-slate-300 dark:bg-slate-700"
                    )}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#0A0E08] shadow-sm ring-0 transition duration-200 ease-in-out",
                        isDark ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Multiple Indian Languages Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-emerald-500" /> 
                      {t('settings.language', 'Language')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('settings.languageDesc', 'Select your preferred Indian language.')}
                    </div>
                  </div>

                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="h-10 rounded-xl border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-[#134E2F] focus:outline-none shadow-xs transition-colors cursor-pointer w-full sm:w-64"
                  >
                    {languages.map((item) => (
                      <option 
                        key={item.code} 
                        value={item.code}
                        className="bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-100"
                      >
                        {item.nativeName} ({item.name})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={user?.avatarUrl || ''}
        userName={name}
        onAvatarUpdated={async (newUrl) => {
          try {
            await updateUserContext({ avatarUrl: newUrl || '' });
            setSuccessMsg(newUrl ? 'Profile picture updated successfully.' : 'Profile picture reset to default.');
            setTimeout(() => setSuccessMsg(null), 4000);
          } catch (e) {
            console.error('Error syncing avatar in settings:', e);
          }
        }}
      />
    </div>
  );
}

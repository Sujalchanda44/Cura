import React, { useState, useEffect } from 'react';
import { 
  X, Check, Target, Scale, Dumbbell, Activity, 
  Moon, Heart, Sparkles, Loader2, Footprints 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: string;
  currentTargetWeight: number | null;
  currentTargetSteps: number;
  currentTargetSleep: number;
  currentTargetWater?: number;
  currentWeight?: number;
  onSave: (data: {
    healthGoal: string;
    targetWeightKg?: number;
    targetSteps?: number;
    targetSleepHours?: number;
    targetWaterMl?: number;
  }) => Promise<void>;
}

const PRESET_GOALS = [
  {
    id: 'weight_management',
    title: 'Healthy Weight Management',
    desc: 'Optimize BMI through sustainable nutrition and balanced caloric targets',
    icon: Scale,
    color: 'emerald',
    badge: 'Metabolic Health'
  },
  {
    id: 'muscle_building',
    title: 'Lean Muscle & Hypertrophy',
    desc: 'Build functional strength, lean muscle mass, and progressive overload',
    icon: Dumbbell,
    color: 'blue',
    badge: 'Hypertrophy'
  },
  {
    id: 'improve_fitness',
    title: 'Cardio Fitness & Stamina',
    desc: 'Boost cardiovascular endurance, daily active minutes, and step count',
    icon: Activity,
    color: 'orange',
    badge: 'Endurance'
  },
  {
    id: 'better_sleep',
    title: 'Restorative Sleep & Recovery',
    desc: 'Deep sleep optimization, stress reduction, and circadian rhythm health',
    icon: Moon,
    color: 'purple',
    badge: 'Recovery'
  },
  {
    id: 'heart_health',
    title: 'Cardiovascular & Heart Health',
    desc: 'Support healthy blood pressure, low sodium, and aerobic vitality',
    icon: Heart,
    color: 'rose',
    badge: 'Cardio Vitality'
  },
  {
    id: 'general_wellness',
    title: 'Holistic Wellness & Longevity',
    desc: 'Balanced hydration, whole foods, and sustainable daily habits',
    icon: Sparkles,
    color: 'teal',
    badge: 'Longevity'
  }
];

export function GoalEditModal({
  isOpen,
  onClose,
  currentGoal,
  currentTargetWeight,
  currentTargetSteps,
  currentTargetSleep,
  currentTargetWater = 2200,
  currentWeight = 50,
  onSave
}: GoalEditModalProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>(currentGoal || 'weight_management');
  const [targetWeight, setTargetWeight] = useState<number | string>(currentTargetWeight || currentWeight || 55);
  const [targetSteps, setTargetSteps] = useState<number>(currentTargetSteps || 8000);
  const [targetSleep, setTargetSleep] = useState<number>(currentTargetSleep || 8);
  const [targetWater, setTargetWater] = useState<number>(currentTargetWater || 2200);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(currentGoal || 'weight_management');
      setTargetWeight(currentTargetWeight || (currentWeight ? Math.round(currentWeight < 55 ? currentWeight + 5 : currentWeight) : 55));
      setTargetSteps(currentTargetSteps || 8000);
      setTargetSleep(currentTargetSleep || 8);
      setTargetWater(currentTargetWater || 2200);
      setError(null);
    }
  }, [isOpen, currentGoal, currentTargetWeight, currentTargetSteps, currentTargetSleep, currentTargetWater, currentWeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const parsedWeight = parseFloat(String(targetWeight));
      if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
        throw new Error('Please enter a valid target weight between 20 kg and 300 kg.');
      }

      await onSave({
        healthGoal: selectedGoal,
        targetWeightKg: parsedWeight,
        targetSteps: Number(targetSteps),
        targetSleepHours: Number(targetSleep),
        targetWaterMl: Number(targetWater)
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update goal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
        className="relative w-full max-w-2xl bg-white dark:bg-[#151A12] border border-slate-200 dark:border-[#273322] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#273322]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-[#134E2F] dark:text-[#C1F3BA]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 id="goal-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Set Health Goals & Targets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cura+ AI dynamically tailors its progress analysis to your selected targets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              1. Choose Primary Health Focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_GOALS.map((g) => {
                const IconComponent = g.icon;
                const isSelected = selectedGoal === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGoal(g.id)}
                    className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#134E2F] dark:border-[#C1F3BA] bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-[#134E2F]/20 dark:ring-[#C1F3BA]/20'
                        : 'border-slate-200 dark:border-[#273322] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#1C2318]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          isSelected 
                            ? 'bg-[#134E2F] text-white dark:bg-[#C1F3BA] dark:text-[#134E2F]' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {g.title}
                        </h4>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] text-white dark:text-[#134E2F] flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {g.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quantitative Target Milestones */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              2. Target Milestones & Daily Baselines
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Target Weight */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#273322] bg-slate-50/50 dark:bg-[#1C2318]">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-emerald-600" /> Target Weight
                  </span>
                  <span className="text-[11px] text-slate-400">Current: {currentWeight} kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="200"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    required
                    className="w-full text-lg font-bold bg-white dark:bg-[#151A12] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                  />
                  <span className="text-sm font-semibold text-slate-500">kg</span>
                </div>
              </div>

              {/* Target Steps */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#273322] bg-slate-50/50 dark:bg-[#1C2318]">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Footprints className="h-3.5 w-3.5 text-blue-500" /> Daily Steps
                  </span>
                  <span className="text-[11px] text-slate-400">Steps/day</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targetSteps}
                    onChange={(e) => setTargetSteps(Number(e.target.value))}
                    className="w-full text-base font-bold bg-white dark:bg-[#151A12] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                  >
                    <option value={5000}>5,000 steps</option>
                    <option value={7000}>7,000 steps</option>
                    <option value={8000}>8,000 steps (Standard)</option>
                    <option value={10000}>10,000 steps (Active)</option>
                    <option value={12000}>12,000 steps (High)</option>
                  </select>
                </div>
              </div>

              {/* Target Sleep */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#273322] bg-slate-50/50 dark:bg-[#1C2318]">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Moon className="h-3.5 w-3.5 text-purple-500" /> Daily Sleep
                  </span>
                  <span className="text-[11px] text-slate-400">Hours/night</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={targetSleep}
                    onChange={(e) => setTargetSleep(Number(e.target.value))}
                    className="w-full text-base font-bold bg-white dark:bg-[#151A12] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#134E2F]"
                  >
                    <option value={7}>7.0 hours</option>
                    <option value={7.5}>7.5 hours</option>
                    <option value={8}>8.0 hours (Recommended)</option>
                    <option value={8.5}>8.5 hours</option>
                    <option value={9}>9.0 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#273322]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl px-5 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#134E2F] hover:bg-[#0E3B23] text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-[#134E2F]/20 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Save Goal & Analyze With AI</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

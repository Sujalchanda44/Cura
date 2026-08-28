import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeartPulse, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="w-full bg-white border-b border-slate-100 p-4">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2 text-primary">
            <HeartPulse className="h-6 w-6" />
            <span className="text-xl font-bold">Cura+</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Your Health Profile</h1>
            <p className="text-slate-500">Help Cura+ personalize your health and food recommendations.</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
            
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'Medical' },
              { num: 3, label: 'Lifestyle' }
            ].map(s => (
              <div key={s.num} className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                  step >= s.num ? "bg-primary text-white" : "bg-white border-2 border-slate-200 text-slate-400"
                )}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={cn(
                  "text-xs font-medium mt-2",
                  step >= s.num ? "text-slate-900" : "text-slate-400"
                )}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={step === 3 ? handleComplete : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1: Personal */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                    <Input type="date" required />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Gender</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Blood Group</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option value="">Select blood group</option>
                      <option value="a+">A+</option>
                      <option value="a-">A-</option>
                      <option value="b+">B+</option>
                      <option value="b-">B-</option>
                      <option value="ab+">AB+</option>
                      <option value="ab-">AB-</option>
                      <option value="o+">O+</option>
                      <option value="o-">O-</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Height (cm)</label>
                    <Input type="number" placeholder="175" required />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
                    <Input type="number" placeholder="70" required />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Medical */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Existing Medical Conditions</label>
                  <Input placeholder="e.g. Hypertension, Diabetes (Comma separated)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Allergies</label>
                  <Input placeholder="e.g. Peanuts, Penicillin (Comma separated)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Medications</label>
                  <Input placeholder="e.g. Lisinopril 10mg daily" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Previous Health Concerns</label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="Any past surgeries or major illnesses?"></textarea>
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-slate-700">Primary Health Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Weight Loss', 'Muscle Gain', 'Better Nutrition', 'More Energy'].map(goal => (
                        <div key={goal} className="flex items-center space-x-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                          <input type="radio" name="goal" id={goal} className="text-primary focus:ring-primary" />
                          <label htmlFor={goal} className="text-sm font-medium text-slate-700 cursor-pointer">{goal}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Activity Level</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option>Sedentary (little to no exercise)</option>
                      <option>Lightly active (1-3 days/week)</option>
                      <option>Moderately active (3-5 days/week)</option>
                      <option>Very active (6-7 days/week)</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Dietary Preferences</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option>No Restrictions</option>
                      <option>Vegetarian</option>
                      <option>Vegan</option>
                      <option>Keto</option>
                      <option>Paleo</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Sleep Duration (avg)</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option>&lt; 5 hours</option>
                      <option>5-6 hours</option>
                      <option>7-8 hours</option>
                      <option>&gt; 8 hours</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-slate-700">Daily Water Intake</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <option>&lt; 1 Liter</option>
                      <option>1 - 2 Liters</option>
                      <option>2 - 3 Liters</option>
                      <option>&gt; 3 Liters</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrev}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {step === 3 ? (isLoading ? 'Analyzing Profile...' : 'Complete Profile') : 'Continue'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

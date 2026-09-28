import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MapPin, Activity, ShieldAlert, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { getUserProfile } from '@/api/userApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import { AvatarUploadModal } from '@/components/AvatarUploadModal';

export default function Profile() {
  const navigate = useNavigate();
  const { user, healthProfile, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarSuccessToast, setAvatarSuccessToast] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Patient Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your personal and health information.</p>
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
                  title="Click to change profile picture (Laptop or Phone)"
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
                  title="Upload profile picture (Laptop or Phone)"
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
                <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                San Francisco, CA
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4 mr-3 text-slate-400" />
                Joined March 2026
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Health Overview</CardTitle>
                <CardDescription>Your basic medical information.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>Edit Details</Button>
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
        </div>
      </div>

      {/* Profile Picture Upload Modal (Laptop & Phone) */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={rawAvatarUrl || ''}
        userName={name}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MapPin, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { getUserProfile } from '@/api/userApi';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const navigate = useNavigate();
  const { user, healthProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

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
  const avatarUrl = user?.avatarUrl || profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=transparent`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Profile</h1>
        <p className="text-slate-500">Manage your personal and health information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Identity Card */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                <p className="text-sm text-slate-500 capitalize">Role: {role}</p>
                <div className="mt-2 flex justify-center">
                  <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-xs">Active Profile</Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="h-4 w-4 mr-3 text-slate-400" />
                {email}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                San Francisco, CA
              </div>
              <div className="flex items-center text-sm text-slate-600">
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
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Height</div>
                  <div className="text-lg font-bold text-slate-900">{height} <span className="text-sm font-normal">cm</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Weight</div>
                  <div className="text-lg font-bold text-slate-900">{weight} <span className="text-sm font-normal">kg</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">BMI</div>
                  <div className="text-lg font-bold text-slate-900">{bmi}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Blood Type</div>
                  <div className="text-lg font-bold text-danger">{bloodType}</div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
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
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-2 text-warning" /> Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allergies.length > 0 ? (
                      allergies.map((alg: string, i: number) => (
                        <Badge key={i} variant="destructive" className="bg-red-50 text-red-700 border-red-200">{alg}</Badge>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm font-normal">None recorded.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Activity, Edit2, ShieldAlert } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Profile</h1>
        <p className="text-slate-500">Manage your personal and health information.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Identity Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=transparent" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">John Doe</h2>
                <p className="text-sm text-slate-500">ID: PT-8472-39X</p>
                <div className="mt-2 flex justify-center">
                  <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100">Premium Member</Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="h-4 w-4 mr-3 text-slate-400" />
                john.doe@example.com
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="h-4 w-4 mr-3 text-slate-400" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                San Francisco, CA
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <User className="h-4 w-4 mr-3 text-slate-400" />
                Joined March 2023
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Health Overview</CardTitle>
                <CardDescription>Your basic medical information.</CardDescription>
              </div>
              <Button variant="outline" size="sm">Edit Details</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Height</div>
                  <div className="text-lg font-bold text-slate-900">175 <span className="text-sm font-normal">cm</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Weight</div>
                  <div className="text-lg font-bold text-slate-900">71.2 <span className="text-sm font-normal">kg</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">BMI</div>
                  <div className="text-lg font-bold text-slate-900">22.4</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Blood Type</div>
                  <div className="text-lg font-bold text-danger">O+</div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-primary" /> Medical Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Mild Asthma</Badge>
                    <Badge variant="secondary">Lactose Intolerance</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-2 text-warning" /> Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="destructive" className="bg-red-50 text-red-600 border border-red-200">Peanuts (Severe)</Badge>
                    <Badge variant="warning" className="bg-orange-50 text-orange-600 border border-orange-200">Penicillin</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>People to contact in case of an emergency.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">
                      SM
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Sarah Mitchell</h4>
                      <p className="text-xs text-slate-500">Spouse</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400"><Phone className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-white border-dashed">
                + Add Emergency Contact
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

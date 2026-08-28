import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Lock, Activity, Globe, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <tab.icon className={cn("mr-2 h-4 w-4", activeTab === tab.id ? "text-primary-foreground" : "text-slate-400")} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your basic account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input type="text" className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input type="email" className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" defaultValue="john.doe@example.com" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                  <CardDescription>Customize your Cura+ experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900 flex items-center"><Moon className="mr-2 h-4 w-4 text-slate-500" /> Dark Mode</div>
                      <div className="text-sm text-slate-500">Toggle dark appearance.</div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900 flex items-center"><Globe className="mr-2 h-4 w-4 text-slate-500" /> Language</div>
                      <div className="text-sm text-slate-500">Select your preferred language.</div>
                    </div>
                    <select className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:ring-primary">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what alerts you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Health Reports', 'Medication Reminders', 'AI Insights', 'Goal Progress'].map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <input type="checkbox" id={item} defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" />
                    <label htmlFor={item} className="text-sm font-medium text-slate-700">{item}</label>
                  </div>
                ))}
                <Button className="mt-4">Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Password</label>
                  <input type="password" className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <input type="password" className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                  <input type="password" className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <Button variant="default">Update Password</Button>
                
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-danger mb-2">Danger Zone</h4>
                  <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated health data.</p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

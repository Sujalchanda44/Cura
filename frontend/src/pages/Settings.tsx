import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Lock, Activity, Globe, Moon, Sun, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, changePassword } from '@/api/userApi';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import { AvatarUploadModal } from '@/components/AvatarUploadModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
  const { user, updateUser: updateUserContext } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();

  const [activeTab, setActiveTab] = useState('preferences');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const tabs = [
    { id: 'preferences', label: t('settings.tab.preferences', 'Preferences'), icon: Activity },
    { id: 'account', label: t('settings.tab.account', 'Account'), icon: User },
    { id: 'notifications', label: t('settings.tab.notifications', 'Notifications'), icon: Bell },
    { id: 'security', label: t('settings.tab.security', 'Security'), icon: Lock },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data) {
          setName(data.name || '');
          setEmail(data.email || '');
        }
      } catch (error) {
        console.error('Error loading settings profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccessMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Password update failed. Verify current password.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t('settings.subtitle', 'Manage your account settings and preferences.')}
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm transition-colors">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm transition-colors">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-[#C1F3BA] text-[#134E2F] dark:text-[#0A0E08] font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2318]"
                )}
              >
                <tab.icon className={cn("mr-2 h-4 w-4", activeTab === tab.id ? "text-[#134E2F] dark:text-[#0A0E08]" : "text-slate-400 dark:text-slate-500")} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card className="shadow-sm">
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
                    
                    {/* Interactive Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDark}
                      onClick={toggleTheme}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
                      className="h-10 rounded-lg border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none shadow-xs transition-colors cursor-pointer w-full sm:w-64"
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
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your basic account details.</CardDescription>
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
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile Picture (DP)</h4>
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
                    className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 dark:border-[#273322] bg-slate-100 dark:bg-[#151A12] px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed transition-colors" 
                    value={email} 
                    disabled 
                  />
                </div>
                <Button onClick={handleSaveAccount} disabled={isSaving} className="mt-2">
                  {isSaving ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.notificationsPref', 'Notification Preferences')}</CardTitle>
                <CardDescription>{t('settings.notificationsDesc', 'Choose what alerts you want to receive.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Health Reports', 'Medication Reminders', 'AI Insights', 'Goal Progress'].map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <input type="checkbox" id={item} defaultChecked className="rounded border-slate-300 dark:border-[#273322] text-primary focus:ring-primary h-4 w-4 bg-white dark:bg-[#1C2318]" />
                    <label htmlFor={item} className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</label>
                  </div>
                ))}
                <Button className="mt-4">{t('settings.savePreferences', 'Save Preferences')}</Button>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.securityTitle', 'Security')}</CardTitle>
                <CardDescription>{t('settings.securityDesc', 'Manage your password and security settings.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.currentPassword', 'Current Password')}</label>
                    <input 
                      type="password" 
                      className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.newPassword', 'New Password')}</label>
                    <input 
                      type="password" 
                      className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('settings.confirmPassword', 'Confirm New Password')}</label>
                    <input 
                      type="password" 
                      className="flex h-10 w-full md:max-w-md rounded-md border border-slate-200 dark:border-[#273322] bg-white dark:bg-[#1C2318] text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSaving} className="mt-2">
                    {isSaving ? t('settings.saving', 'Saving...') : t('settings.updatePassword', 'Update Password')}
                  </Button>
                </form>
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

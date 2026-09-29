import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ScanLine, 
  MessageSquareHeart, Activity, User, Settings, 
  LogOut, Moon, Sun, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarUrl } from '@/lib/avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();

  // Guard: Only freshly registered users in active session are redirected to onboarding
  useEffect(() => {
    const isFreshRegistration = sessionStorage.getItem('cura_just_registered') === 'true' || !!user?.isNewRegistration;
    if (user && !user.isOnboarded && isFreshRegistration && user.role !== 'admin') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  const navigation = [
    { name: t('nav.dashboard', 'Dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.scanner', 'Food Scanner'), href: '/scanner', icon: ScanLine },
    { name: t('nav.aiAssistant', 'AI Assistant'), href: '/ai-assistant', icon: MessageSquareHeart },
    { name: t('nav.reports', 'Health Reports'), href: '/reports', icon: Activity },
  ];

  const secondaryNavigation = [
    { name: t('nav.profile', 'Profile'), href: '/profile', icon: User },
    { name: t('nav.settings', 'Settings'), href: '/settings', icon: Settings },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#151A12]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#273322] z-50 pb-safe shadow-lg transition-colors">
      <div className="flex justify-around items-center h-16">
        {[
          { name: t('nav.dashboard', 'Home'), href: '/dashboard', icon: LayoutDashboard },
          { name: t('nav.scanner', 'Scan'), href: '/scanner', icon: ScanLine },
          { name: t('nav.aiAssistant', 'AI'), href: '/ai-assistant', icon: MessageSquareHeart },
          { name: t('nav.reports', 'Reports'), href: '/reports', icon: Activity },
          { name: t('nav.profile', 'Profile'), href: '/profile', icon: User },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              location.pathname === item.href 
                ? "text-[#134E2F] dark:text-[#C1F3BA] font-bold" 
                : "text-slate-400 hover:text-[#134E2F] dark:hover:text-[#C1F3BA]"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFDF8] dark:bg-[#0D1109] font-sans flex text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/95 dark:bg-[#151A12]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-[#273322] fixed inset-y-0 z-10 shadow-sm transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-[#273322]">
          <Link to="/dashboard">
            <Logo size="md" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                  location.pathname === item.href 
                    ? "bg-[#C1F3BA] text-[#134E2F] dark:text-[#0A0E08] font-bold shadow-sm shadow-[#C1F3BA]/40" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-[#F2FBF1] dark:hover:bg-[#1C2318] hover:text-[#134E2F] dark:hover:text-[#C1F3BA]"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  location.pathname === item.href 
                    ? "text-[#134E2F] dark:text-[#0A0E08]" 
                    : "text-slate-400 group-hover:text-[#134E2F] dark:group-hover:text-[#C1F3BA]"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div>
            <h4 className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              {t('nav.account', 'Account')}
            </h4>
            <nav className="space-y-1.5">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                    location.pathname === item.href 
                      ? "bg-[#C1F3BA] text-[#134E2F] dark:text-[#0A0E08] font-bold shadow-sm shadow-[#C1F3BA]/30" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-[#F2FBF1] dark:hover:bg-[#1C2318] hover:text-[#134E2F] dark:hover:text-[#C1F3BA]"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-4.5 w-4.5 transition-colors",
                    location.pathname === item.href 
                      ? "text-[#134E2F] dark:text-[#0A0E08]" 
                      : "text-slate-400 group-hover:text-[#134E2F] dark:group-hover:text-[#C1F3BA]"
                  )} />
                  {item.name}
                </Link>
              ))}
              <a
                href="#"
                onClick={handleLogout}
                className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-[#FF6554] hover:bg-[#FF6554]/10 transition-colors group"
              >
                <LogOut className="mr-3 h-4.5 w-4.5 text-[#FF6554] group-hover:scale-105" />
                {t('nav.signOut', 'Sign Out')}
              </a>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 h-screen">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-[#151A12]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-[#273322] flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 transition-colors duration-200">
          <div className="flex items-center md:hidden">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
          </div>

          <div className="flex-1 md:flex-none"></div>

          <div className="flex items-center space-x-3">
            {/* Quick Language Selector */}
            <div className="relative flex items-center">
              <Globe className="h-4 w-4 text-slate-400 mr-1.5 hidden sm:inline" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="text-xs font-semibold bg-slate-50 dark:bg-[#1C2318] border border-slate-200 dark:border-[#273322] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                title="Select Indian Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-[#151A12] text-slate-800 dark:text-slate-100">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Dark/Light Theme Toggle */}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#134E2F] dark:hover:text-[#C1F3BA] hover:bg-[#F2FBF1] dark:hover:bg-[#1C2318] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-400 transition-transform duration-300 hover:rotate-45 pointer-events-none" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300 transition-transform duration-300 hover:-rotate-12 pointer-events-none" />
              )}
            </button>

            
            {/* Patient Profile */}
            <Link to="/profile" className="hidden sm:flex items-center space-x-2" title="View Patient Profile">
              <div className="h-8 w-8 rounded-xl bg-[#C1F3BA]/25 flex items-center justify-center overflow-hidden border border-[#C1F3BA]/50 shadow-xs">
                <img 
                  src={getAvatarUrl(user?.avatarUrl, user?.name)} 
                  alt={user?.name || "User Avatar"} 
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

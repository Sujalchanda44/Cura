import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ScanLine, Utensils, 
  MessageSquareHeart, Activity, User, Settings, 
  Bell, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Scanner', href: '/scanner', icon: ScanLine },
    { name: 'Recommendations', href: '/recommendations', icon: Utensils },
    { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquareHeart },
    { name: 'Health Reports', href: '/reports', icon: Activity },
  ];

  const secondaryNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200/50 z-50 pb-safe shadow-lg">
      <div className="flex justify-around items-center h-16">
        {[
          { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Scan', href: '/scanner', icon: ScanLine },
          { name: 'AI', href: '/ai-assistant', icon: MessageSquareHeart },
          { name: 'Reports', href: '/reports', icon: Activity },
          { name: 'Profile', href: '/profile', icon: User },
        ].map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              location.pathname === item.href ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100/50">
          <Link to="/dashboard">
            <Logo size="md" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                  location.pathname === item.href 
                    ? "bg-blue-600/10 text-blue-600 shadow-sm border border-blue-100/20" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  location.pathname === item.href ? "text-blue-600" : "text-slate-400 group-hover:text-slate-500"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div>
            <h4 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Account</h4>
            <nav className="space-y-1.5">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                    location.pathname === item.href 
                      ? "bg-blue-600/10 text-blue-600 shadow-sm border border-blue-100/20" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="mr-3 h-4.5 w-4.5 text-slate-400 group-hover:text-slate-500" />
                  {item.name}
                </Link>
              ))}
              <a
                href="#"
                onClick={handleLogout}
                className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors group"
              >
                <LogOut className="mr-3 h-4.5 w-4.5 text-rose-500 group-hover:text-rose-600" />
                Sign Out
              </a>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 h-screen">
        {/* Header */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center md:hidden">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
          </div>

          <div className="flex-1 md:flex-none"></div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
            </Button>
            
            <Link to="/profile" className="hidden sm:flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-blue-600/10 flex items-center justify-center overflow-hidden border border-blue-100">
                <img 
                  src={user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=transparent"} 
                  alt="User Avatar" 
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

import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  HeartPulse, LayoutDashboard, ScanLine, Utensils, 
  MessageSquareHeart, Activity, User, Settings, 
  Bell, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const location = useLocation();

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

  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
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
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              location.pathname === item.href ? "text-primary" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center space-x-2 text-primary">
            <HeartPulse className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">Cura+</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-8">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  location.pathname === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  location.pathname === item.href ? "text-primary" : "text-slate-400 group-hover:text-slate-500"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <h4 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</h4>
            <nav className="space-y-1">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    location.pathname === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                  {item.name}
                </Link>
              ))}
              <Link
                to="/login"
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-danger/10 hover:text-danger transition-colors group"
              >
                <LogOut className="mr-3 h-4 w-4 text-slate-400 group-hover:text-danger" />
                Sign Out
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center md:hidden">
            <Link to="/dashboard" className="flex items-center space-x-2 text-primary mr-4">
              <HeartPulse className="h-6 w-6" />
              <span className="text-xl font-bold">Cura+</span>
            </Link>
          </div>

          <div className="flex-1 md:flex-none"></div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger"></span>
            </Button>
            
            <Link to="/profile" className="hidden sm:flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=transparent" alt="User Avatar" />
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

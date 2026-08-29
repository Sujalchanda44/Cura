import { Outlet, Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Left side - Branding/Illustration */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-primary p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-800 -z-10" />
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <Link to="/" className="flex items-center space-x-2 z-10">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <HeartPulse className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight">Cura+</span>
        </Link>
        
        <div className="max-w-md z-10 mt-20">
          <h1 className="text-4xl font-bold mb-6 leading-tight">Your Personal AI Health Companion</h1>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Track your health, understand your food, and make smarter daily decisions with AI-powered personalized insights.
          </p>
          
          <div className="flex items-center space-x-4 text-sm font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-blue-300 overflow-hidden flex justify-center items-center">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=transparent`} alt="avatar" />
                </div>
              ))}
            </div>
            <span>Join 10,000+ users</span>
          </div>
        </div>
        
        <div className="text-sm text-primary-foreground/60 z-10">
          &copy; {new Date().getFullYear()} Cura+ Technologies
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <Link to="/" className="flex items-center space-x-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-slate-900">Cura+</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-slate-100 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

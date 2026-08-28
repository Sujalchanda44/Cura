import { Outlet, Link } from 'react-router-dom';
import { HeartPulse, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Cura+</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#ai-assistant" className="hover:text-primary transition-colors">AI Assistant</a>
            <a href="#reviews" className="hover:text-primary transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors hidden sm:block">
              Login
            </Link>
            <Link to="/register">
              <Button className="rounded-full px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-slate-900">Cura+</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">Your Personal AI Health Companion</p>
          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Cura+ Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

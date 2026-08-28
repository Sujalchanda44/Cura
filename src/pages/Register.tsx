import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
        <p className="text-sm text-slate-500">Enter your information to get started</p>
      </div>
      
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">Full Name</label>
          <Input id="name" type="text" placeholder="John Doe" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="name@example.com" required />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
          <Input id="password" type="password" placeholder="••••••••" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">Confirm Password</label>
          <Input id="confirm-password" type="password" placeholder="••••••••" required />
        </div>
        
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      
      <div className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
      
      <p className="text-xs text-center text-slate-400 mt-4">
        By creating an account, you agree to our{' '}
        <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and{' '}
        <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
      </p>
    </div>
  );
}

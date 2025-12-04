import React, { useState, FormEvent } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthStatus } from '../types';
import { Input } from './Input';
import { Button } from './Button';
import { Logo } from './Logo';
import { SocialAuth } from './SocialAuth';
import { Testimonial } from './Testimonial';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(AuthStatus.LOADING);

    // Mock validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      setStatus(AuthStatus.IDLE);
      return;
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address.");
      setStatus(AuthStatus.IDLE);
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      // Mock success for any input
      setStatus(AuthStatus.SUCCESS);
      setTimeout(onLoginSuccess, 800); // Small delay to show success state
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      
      {/* Left Panel - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 bg-slate-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop" 
            alt="Office background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 to-slate-900/90" />
        </div>

        {/* Brand Content */}
        <div className="relative z-10">
          <Logo variant="light" className="mb-8" />
        </div>

        <div className="relative z-10 max-w-xl">
           <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
             Manage your enterprise with <span className="text-brand-400">clarity</span>.
           </h1>
           <p className="text-xl text-slate-300 mb-12 font-light">
             Join over 4,000 forward-thinking companies using Vissito to drive growth and efficiency.
           </p>
           <Testimonial />
        </div>
        
        <div className="relative z-10 text-slate-400 text-sm flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="ml-auto">© 2024 Vissito Inc.</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-600">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error && !email ? 'Email is required' : undefined}
                autoComplete="email"
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error && !password ? 'Password is required' : undefined}
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                   <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                     Forgot password?
                   </a>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              isLoading={status === AuthStatus.LOADING}
              className={status === AuthStatus.SUCCESS ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {status === AuthStatus.SUCCESS ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} /> Signed in successfully
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in to Account <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <SocialAuth />

          <p className="text-center text-sm text-slate-600 mt-8">
            Don't have an account?{' '}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Start your 14-day free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
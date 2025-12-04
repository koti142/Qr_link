import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import SocialAuth from '../components/ui/SocialAuth';
import api from '../services/api';

/**
 * Admin Login Page
 * 
 * Features:
 * - Split screen design (branding left, form right)
 * - Modern floating label inputs
 * - Loading and success states
 * - Social authentication options
 * - Responsive design
 */
function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    // Validation
    if (!username || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setSuccess(true);
      
      // Navigate after showing success state
      setTimeout(() => {
        navigate('/admin');
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden antialiased text-slate-900">
      
      {/* Left Panel - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 bg-slate-900 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=2301&auto=format&fit=crop" 
            alt="Video streaming background" 
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
             Stream your content with <span className="text-brand-400">confidence</span>.
           </h1>
           <p className="text-xl text-slate-300 mb-12 font-light">
             Join thousands of educators and organizations using Video Delivery to manage and distribute their video content efficiently.
           </p>
        </div>
        
        <div className="relative z-10 text-slate-400 text-sm flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="ml-auto">© 2024 Video Delivery</span>
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
            <p className="mt-2 text-slate-600">Please enter your credentials to access the admin panel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={error && !username ? 'Username is required' : undefined}
                autoComplete="username"
                required
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error && !password ? 'Password is required' : undefined}
                  autoComplete="current-password"
                  required
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
              isLoading={loading}
              className={success ? "!bg-green-600 !hover:bg-green-700 !text-white" : "!bg-blue-600 !hover:bg-blue-700 !text-white !shadow-md"}
            >
              {success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} /> Signed in successfully
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in to Admin Panel <ArrowRight size={18} />
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
            Need help?{' '}
            <a href="#" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

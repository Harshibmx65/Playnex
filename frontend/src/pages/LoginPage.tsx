import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { PlaynexLogo } from '../components/layout/PlaynexLogo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { extractErrorMessage } from '../utils/format';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please enter both your email address and password');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login(cleanEmail, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillDemo = () => {
    setEmail('testuser123@example.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 relative selection:bg-cyan-400 selection:text-black transition-colors duration-200">
      {/* Top Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md my-8">
        {/* Logo & Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="mb-3 hover:scale-105 transition-transform">
            <PlaynexLogo size="lg" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Sign In to Playnex
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Distraction-free YouTube playlist learning & progress platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] shadow-md dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.08] pb-3 font-mono">
            <span>Enter your credentials</span>
            <button
              type="button"
              onClick={handleQuickFillDemo}
              className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-[#00e5ff] hover:underline font-bold"
              title="Fill with test account credentials"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Demo User</span>
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your account password"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black text-xs font-mono font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-600 dark:text-[#00e5ff] hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

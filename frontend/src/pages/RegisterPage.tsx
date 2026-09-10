import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  Compass,
  Check
} from 'lucide-react';
import { PlaynexLogo } from '../components/layout/PlaynexLogo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { extractErrorMessage } from '../utils/format';

export const RegisterPage: React.FC = () => {
  const { register, loginGuest } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\/;'`~]/.test(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasSpecialChar;
  const isFormValid = name.trim().length >= 2 && email.trim().length > 3 && isPasswordValid && passwordsMatch;

  // Strength score (0-4)
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasSpecialChar].filter(Boolean).length;
  const strengthLabel = strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Moderate' : 'Strong';
  const strengthColor = strengthScore <= 1 ? 'bg-rose-500' : strengthScore <= 3 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!hasUppercase) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!hasLowercase) {
      setError('Password must contain at least one lowercase letter (a-z)');
      return;
    }
    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*...)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(cleanName, cleanEmail, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setIsGuestLoading(true);
    setError(null);
    try {
      await loginGuest();
      navigate('/dashboard');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Guest login failed. Please try again.'));
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 relative selection:bg-cyan-400 selection:text-black transition-colors duration-200">
      {/* Top Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
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
            Create Playnex Account
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono font-medium">
            Distraction-free playlist player & precision learning platform
          </p>
        </div>

        {/* Registration Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] shadow-xl space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Password
                </label>
                {password.length > 0 && (
                  <span className={`text-[11px] font-mono font-bold ${
                    strengthScore <= 1 ? 'text-rose-500' : strengthScore <= 3 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 symbol"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Progress Bar */}
              {password.length > 0 && (
                <div className="mt-1.5 h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${strengthColor}`} 
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Live Password Criteria Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.08] space-y-1.5 text-xs font-mono">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password Requirements:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                  <span>Min 8 characters</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                  <span>1 uppercase letter</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                  <span>1 lowercase letter</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {hasSpecialChar ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-block text-center">•</span>}
                  <span>1 special character</span>
                </div>
              </div>

              {confirmPassword.length > 0 && (
                <div className={`pt-1 border-t border-slate-200 dark:border-white/5 flex items-center gap-1.5 text-[11px] ${
                  passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'
                }`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all mt-2 ${
                isFormValid && !isLoading
                  ? 'bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black shadow-cyan-500/20 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              }`}
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Account & Start Learning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Guest Mode Direct Access Option */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleGuestAccess}
              disabled={isGuestLoading || isLoading}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#070b14] hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
              title="Explore Playnex with starter environment without creating an account"
            >
              {isGuestLoading ? (
                <span>Launching Guest Mode...</span>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00e5ff]" />
                  <span>Explore in Instant Guest Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-cyan-700 dark:text-[#00e5ff] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  ShieldCheck, 
  RefreshCw, 
  Edit3,
  KeyRound,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { PlaynexLogo } from '../components/layout/PlaynexLogo';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { OtpResponse } from '../types';
import { extractErrorMessage } from '../utils/format';

export const RegisterPage: React.FC = () => {
  const { sendRegisterOtp, verifyRegisterOtp, resendRegisterOtp, register } = useAuth();
  const navigate = useNavigate();

  // Step state: 1 = Details, 2 = OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpInfo, setOtpInfo] = useState<OtpResponse | null>(null);
  const [showSmtpGuide, setShowSmtpGuide] = useState(false);

  // Timer cooldown
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Submit details and send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await sendRegisterOtp(cleanName, cleanEmail, password);
      setOtpInfo(res);
      setStep(2);
      setCooldown(res.cooldown_seconds || 60);
      if (res.dev_otp) {
        setSuccessMessage(`OTP generated! Auto-fill code is available below.`);
      } else {
        setSuccessMessage(`Verification code sent to ${cleanEmail}`);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to send verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Register Bypass (Instant registration without OTP for frictionless onboarding)
  const handleDirectRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || password.length < 6) {
      setError('Please fill in your name, valid email, and a password (min 6 characters) above.');
      return;
    }

    setIsDirectLoading(true);
    setError(null);

    try {
      await register(cleanName, cleanEmail, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Direct registration failed. Please try the OTP verification method.'));
    } finally {
      setIsDirectLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      setError('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyRegisterOtp(cleanEmail, cleanOtp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid verification code. Please check and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    const cleanEmail = email.trim().toLowerCase();
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await resendRegisterOtp(cleanEmail);
      setOtpInfo(res);
      setCooldown(res.cooldown_seconds || 60);
      if (res.dev_otp) {
        setSuccessMessage('A new verification code was generated (Dev Mode)');
      } else {
        setSuccessMessage('A new verification code has been dispatched to your email.');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleAutoFillOtp = (code: string) => {
    setOtpCode(code);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 relative selection:bg-cyan-400 selection:text-black transition-colors duration-200">
      {/* Top Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
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
            {step === 1 ? 'Create Playnex Account' : 'Verify Your Email'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {step === 1 
              ? 'Distraction-free playlist player & revision management'
              : `Enter the 6-digit code sent to ${email}`
            }
          </p>
        </div>


        {/* Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] shadow-xl space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

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
                    placeholder="At least 6 characters"
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
                disabled={isLoading || isDirectLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black text-xs font-mono font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
              >
                {isLoading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Direct Instant Register Fallback Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleDirectRegister}
                  disabled={isDirectLoading || isLoading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-[#070b14] hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Create account directly without email code"
                >
                  {isDirectLoading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00e5ff]" />
                      <span>Instant Sign Up (Direct Access)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Code sent to</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-[#00e5ff] hover:underline shrink-0 ml-2 font-bold"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* Dev Mode OTP Banner (When SMTP is in local mode) */}
              {otpInfo?.dev_otp && (
                <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-[#0e1c36] border border-cyan-300 dark:border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300">
                      <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Development Mode Active</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-200/60 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                      Auto-Code
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                    SMTP server is not configured in <code className="font-mono bg-cyan-100 dark:bg-black/40 px-1 py-0.5 rounded text-[11px]">backend/.env</code>. Your verification code is:
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-lg font-black tracking-widest text-cyan-900 dark:text-white bg-white dark:bg-black/50 px-3 py-1 rounded-lg border border-cyan-200 dark:border-white/10 shadow-inner">
                      {otpInfo.dev_otp}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAutoFillOtp(otpInfo.dev_otp!)}
                      className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm active:scale-95 transition-all"
                    >
                      Auto-fill Code
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5 text-cyan-600 dark:text-[#00e5ff]" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                    }}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] focus:border-cyan-500 dark:focus:border-[#00e5ff] rounded-xl text-center text-xl font-mono tracking-[0.5em] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex items-center justify-between">
                  <span>Code expires in 10 minutes</span>
                  <span className="font-semibold">{otpCode.length}/6 digits</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 4}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ${
                  otpCode.length >= 4 && !isLoading
                    ? 'bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black shadow-cyan-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isLoading ? (
                  <span>Verifying Code & Activating Account...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Start Learning</span>
                  </>
                )}
              </button>

              {/* Resend Cooldown Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className={`flex items-center gap-1 font-semibold transition-colors ${
                    cooldown > 0 || isResending
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-cyan-600 dark:text-[#00e5ff] hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </span>
                </button>
              </div>

              {/* SMTP Configuration Help Accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSmtpGuide(!showSmtpGuide)}
                  className="flex items-center justify-between w-full text-[11px] font-mono text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1"
                >
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    How to enable real inbox email delivery
                  </span>
                  {showSmtpGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSmtpGuide && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-[#070b14] border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1.5 animate-fade-in">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Configure SMTP in <span className="text-cyan-600 dark:text-cyan-400">backend/.env</span>:
                    </p>
                    <pre className="p-2 rounded bg-white dark:bg-black/40 text-[10px] text-slate-800 dark:text-slate-200 overflow-x-auto">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_TLS=True`}
                    </pre>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      *For Gmail, generate an App Password in your Google Account &gt; Security &gt; 2-Step Verification.
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-600 dark:text-[#00e5ff] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

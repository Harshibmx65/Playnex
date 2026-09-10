import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  HelpCircle, 
  RotateCw, 
  Zap, 
  EyeOff, 
  Layers, 
  BarChart3,
  Compass,
  ArrowRight
} from 'lucide-react';
import { PlaynexLogo } from '../components/layout/PlaynexLogo';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const LandingPage: React.FC = () => {
  const { user, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestAccess = async () => {
    setIsGuestLoading(true);
    try {
      await loginGuest();
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Check if user is a signed-up registered account (not a temporary guest)
  const isRegisteredUser = user && !user.is_guest;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-400 selection:text-black speedtest-bg overflow-x-hidden transition-colors duration-200">
      {/* Top Public Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/85 dark:bg-[#080d1a]/85 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="shrink-0" title="Playnex Home">
            <PlaynexLogo size="md" />
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 font-sans">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {isRegisteredUser ? (
              /* Open Dashboard shown ONLY when registered/signed up */
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-black bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] hover:from-[#38e1ff] hover:to-[#00e5ff] rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
            ) : (
              /* New / Guest User Actions */
              <>
                <button
                  onClick={handleGuestAccess}
                  disabled={isGuestLoading}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/15 rounded-xl transition-all"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00e5ff]" />
                  <span>{isGuestLoading ? 'Loading...' : 'Guest Mode'}</span>
                </button>

                {/* Sign In Button */}
                <Link
                  to="/login"
                  className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 dark:bg-gradient-to-r dark:from-[#0c1527] dark:via-[#0f1d38] dark:to-[#0c1527] border border-slate-300 dark:border-white/15 shadow-sm hover:border-cyan-500/60 dark:text-slate-200 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-300 font-mono text-xs font-bold uppercase overflow-hidden group cursor-pointer"
                >
                  <span>SIGN IN</span>
                </Link>

                {/* Sign Up Button */}
                <Link
                  to="/register"
                  className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-gradient-to-r dark:from-[#0c1527] dark:via-[#0f1d38] dark:to-[#0c1527] border border-cyan-500/50 shadow-md hover:border-cyan-400 hover:shadow-cyan-500/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 font-mono text-xs font-black uppercase overflow-hidden group cursor-pointer"
                >
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] bg-clip-text text-transparent group-hover:from-white group-hover:to-[#38f8ff] tracking-wider transition-all">
                    SIGN UP
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden border-b border-slate-200/80 dark:border-white/[0.06]">
        {/* Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 dark:bg-[#00e5ff]/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-[#00e5ff] border border-cyan-500/30 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00e5ff]" />
            <span>PRECISION STUDY & PROGRESS ACCELERATOR</span>
          </div>

          {/* Headline */}
          <div className="space-y-5 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.08]">
              Learn From YouTube. <br />
              <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-600 dark:from-[#00e5ff] dark:via-[#00f2fe] dark:to-[#00e676] bg-clip-text text-transparent">
                Zero Distractions.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
              Import entire YouTube playlist courses into a high-speed, distraction-free player with exact timestamped notes, doubt resolution, and automated spaced revision.
            </p>
          </div>

          {/* Big Prominent Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-9 py-4 sm:px-11 sm:py-5 text-base sm:text-lg font-black text-black bg-gradient-to-r from-[#00e5ff] via-[#38e1ff] to-[#00b0ff] hover:from-[#38e1ff] hover:to-[#00e5ff] rounded-2xl shadow-xl shadow-cyan-500/30 active:scale-95 hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 group"
            >
              <span>Create New Account</span>
              <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={handleGuestAccess}
              disabled={isGuestLoading}
              className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 bg-white hover:bg-slate-100 dark:bg-[#0c152a] dark:hover:bg-[#122040] border border-slate-300 dark:border-white/20 hover:border-cyan-500 dark:hover:border-[#00e5ff]/60 rounded-2xl shadow-md dark:shadow-xl dark:shadow-black/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Compass className="w-5 h-5 text-cyan-600 dark:text-[#00e5ff]" />
              <span>{isGuestLoading ? 'Launching Guest...' : 'Explore as Guest'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* WHY Playnex? Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-6 sm:p-10 bg-white dark:bg-gradient-to-b dark:from-[#0c152a] dark:via-[#0a1122] dark:to-[#080e1a] border border-cyan-500/30 dark:border-[#00e5ff]/40 shadow-xl dark:shadow-2xl dark:shadow-cyan-500/10 overflow-hidden">
          {/* Top Rim Reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
            <div className="space-y-1.5">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
                WHY <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-600 dark:from-[#00e5ff] dark:via-[#38e1ff] dark:to-[#00e676] bg-clip-text text-transparent">Playnex?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-normal max-w-2xl">
                Generic video players are built for entertainment. Playnex is purpose-engineered for technical curriculum completion, frame-exact notes, and active recall.
              </p>
            </div>
          </div>

          {/* 4 Clean Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#080d1a]/90 border border-slate-300 dark:border-white/[0.12] flex items-center justify-center text-center hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-[#0c1527] transition-all shadow-sm dark:shadow-lg min-h-[80px]">
              <span className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
                0 sidebar feeds & ads
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#080d1a]/90 border border-slate-300 dark:border-white/[0.12] flex items-center justify-center text-center hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-[#0c1527] transition-all shadow-sm dark:shadow-lg min-h-[80px]">
              <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                Active spaced revision
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#080d1a]/90 border border-slate-300 dark:border-white/[0.12] flex items-center justify-center text-center hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-[#0c1527] transition-all shadow-sm dark:shadow-lg min-h-[80px]">
              <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-300 tracking-tight">
                Exact timestamp jump
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#080d1a]/90 border border-slate-300 dark:border-white/[0.12] flex items-center justify-center text-center hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-[#0c1527] transition-all shadow-sm dark:shadow-lg min-h-[80px]">
              <span className="text-sm sm:text-base font-black text-cyan-700 dark:text-[#00e5ff] tracking-tight">
                Faster course finish rate
              </span>
            </div>
          </div>

          {/* Benchmark Comparison Table in curved inner box */}
          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-300 dark:border-white/[0.12] bg-slate-50 dark:bg-[#080d1a]">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.12] bg-slate-100 dark:bg-[#101b33] text-slate-900 dark:text-slate-100">
                  <th className="py-3.5 px-5 font-bold uppercase">Capability</th>
                  <th className="py-3.5 px-5 text-slate-700 dark:text-slate-300 font-bold uppercase">Generic YouTube</th>
                  <th className="py-3.5 px-5 text-cyan-700 dark:text-[#00e5ff] font-black uppercase">Playnex Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.08] text-slate-800 dark:text-slate-100 font-sans">
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-950 dark:text-white">Focus & Zero Distractions</td>
                  <td className="py-3.5 px-5 text-rose-700 dark:text-rose-400 font-semibold">❌ Clickbait & Algorithmic Feeds</td>
                  <td className="py-3.5 px-5 text-emerald-700 dark:text-emerald-300 font-bold">✓ Pure Curriculum Isolation</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-950 dark:text-white">Timestamped Code Notebook</td>
                  <td className="py-3.5 px-5 text-rose-700 dark:text-rose-400 font-semibold">❌ External unlinked docs</td>
                  <td className="py-3.5 px-5 text-emerald-700 dark:text-emerald-300 font-bold">✓ 1-Click Frame Seek Notes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-950 dark:text-white">Doubts Tracking Hub</td>
                  <td className="py-3.5 px-5 text-rose-700 dark:text-rose-400 font-semibold">❌ Lost in comment section</td>
                  <td className="py-3.5 px-5 text-emerald-700 dark:text-emerald-300 font-bold">✓ Dedicated Timestamp Doubts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-950 dark:text-white">Spaced Revision Queues</td>
                  <td className="py-3.5 px-5 text-rose-700 dark:text-rose-400 font-semibold">❌ Rapid concept decay</td>
                  <td className="py-3.5 px-5 text-emerald-700 dark:text-emerald-300 font-bold">✓ Priority Repetition System</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-cyan-700 dark:text-[#00e5ff] bg-cyan-500/10 border border-cyan-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>EXCLUSIVE LEARNING TOOLS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            Engineered for <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-600 dark:from-[#00e5ff] dark:via-[#00f2fe] dark:to-[#00e676] bg-clip-text text-transparent">Deep Learning</span>
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            YouTube hosts the world's best free technical educators. Playnex turns their playlists into a structured mastery platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Zero Distractions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-cyan-500/50 dark:hover:border-[#00e5ff]/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <EyeOff className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-[#00e5ff] transition-colors">
                Distraction-Free Environment
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                No recommended rabbit holes, clickbait thumbnails, or distracting comment sections. Just your curriculum, full focus, and clean code.
              </p>
            </div>
          </div>

          {/* Card 2: Precision Timestamp Seeking */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-cyan-500/50 dark:hover:border-[#00e5ff]/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-[#00e5ff] transition-colors">
                Timestamp Precision Notebook
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Take code notes with exact seconds captured automatically. Click any note timestamp chip to jump the player straight to that frame.
              </p>
            </div>
          </div>

          {/* Card 3: Doubt Resolver */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Interactive Doubt Resolver
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Never get stuck. Mark confusing points as doubts with exact timestamps. Keep track of open vs resolved questions with clear solution notes.
              </p>
            </div>
          </div>

          {/* Card 4: Revision Queue */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-amber-500/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCw className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Spaced Revision Queue
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Fight concept decay. Flag difficult videos with High, Medium, or Low priority. Enter dedicated Revision Mode to review before interviews.
              </p>
            </div>
          </div>

          {/* Card 5: Multi-Tag Filtering */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Custom Tag Matrix
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Organize videos with custom tags like Interview, DSA, Important, and filter matching curriculum in 1 click.
              </p>
            </div>
          </div>

          {/* Card 6: Auto Progress Tracking */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 transition-all duration-300 space-y-4 group shadow-md dark:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Real-Time Progress Velocity
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Smart progress detection updates completion percentages and watch milestones automatically while saving your exact playback positions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-900 dark:bg-gradient-to-b dark:from-[#101b33] dark:to-[#0a1224] text-white border border-slate-800 dark:border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 dark:bg-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to <span className="bg-gradient-to-r from-[#00e5ff] via-[#00f2fe] to-[#00e676] bg-clip-text text-transparent">Accelerate Your Learning?</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto leading-relaxed">
            Import your favorite coding, mathematics, or engineering YouTube playlists today and achieve actual course completion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-4.5 text-base sm:text-lg font-black text-black bg-[#00e5ff] hover:bg-[#38e1ff] rounded-2xl shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
            >
              Create New Account
            </Link>
            <button
              onClick={handleGuestAccess}
              disabled={isGuestLoading}
              className="w-full sm:w-auto px-8 py-4 sm:px-9 sm:py-4.5 text-base sm:text-lg font-bold text-slate-100 bg-[#142142] hover:bg-[#1a2b54] border border-white/15 rounded-2xl transition-all"
            >
              {isGuestLoading ? 'Launching Guest...' : 'Explore as Guest'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#060a14] py-8 text-center text-xs text-slate-700 dark:text-slate-300 font-sans transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <PlaynexLogo size="sm" />
            <span className="text-slate-600 dark:text-slate-300 font-bold">— Precisely Track your progress</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Link to="/login" className="hover:text-cyan-600 dark:hover:text-[#00e5ff] transition-colors font-bold">Sign In</Link>
            <Link to="/register" className="hover:text-cyan-600 dark:hover:text-[#00e5ff] transition-colors font-bold">Register</Link>
            <span>•</span>
            <span className="font-mono">© {new Date().getFullYear()} Playnex</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

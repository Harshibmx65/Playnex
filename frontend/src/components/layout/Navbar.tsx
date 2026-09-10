import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  LogOut, 
  User as UserIcon, 
  Activity, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';

import { PlaynexLogo } from './PlaynexLogo';
import { ThemeToggle } from './ThemeToggle';
import ImportPlaylistModal from '../playlist/ImportPlaylistModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Browse', path: '/dashboard' },
    { name: 'Revision Queue', path: '/revision' },
    { name: 'Doubts Hub', path: '/doubts' },
    { name: 'Notebook', path: '/notes' },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/85 dark:bg-[#070b14]/90 backdrop-blur-xl transition-colors">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 w-full">
          {/* Left Brand & Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Mobile Sidebar Toggle */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] lg:hidden transition-colors"
                title="Toggle Menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Playnex Logo links to home/base page */}
            <Link to="/" className="shrink-0" title="Playnex Home">
              <PlaynexLogo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`transition-all py-1 font-sans ${
                      isActive
                        ? 'text-slate-950 dark:text-white font-black border-b-2 border-cyan-500 dark:border-[#00e5ff] tracking-tight'
                        : 'text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Guest Session Pill */}
            {user?.is_guest && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-mono font-bold shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Guest Session</span>
              </span>
            )}

            {/* Import YouTube Playlist Button */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-black text-black bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] hover:from-[#38e1ff] hover:to-[#00e5ff] rounded-xl shadow-md shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline font-bold">Import Playlist</span>
              <span className="sm:hidden font-bold">Import</span>
            </button>

            {/* Sign Up Button for Guests */}
            {user?.is_guest && (
              <Link
                to="/register"
                className="relative inline-flex items-center justify-center px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 dark:bg-gradient-to-r dark:from-[#0c1527] dark:via-[#0f1d38] dark:to-[#0c1527] border border-cyan-500/50 shadow-md hover:border-cyan-400 hover:scale-[1.03] active:scale-95 transition-all duration-300 select-none overflow-hidden group cursor-pointer z-10"
              >
                <span className="font-black text-xs tracking-wider uppercase bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] bg-clip-text text-transparent group-hover:from-white group-hover:to-[#38f8ff] transition-all">
                  SIGN UP
                </span>
              </Link>
            )}

            {/* Circular User Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gradient-to-tr dark:from-[#00e5ff]/25 dark:via-[#101b33] dark:to-[#00b0ff]/30 flex items-center justify-center font-bold text-cyan-600 dark:text-[#00e5ff] text-xs border border-slate-300 dark:border-[#00e5ff]/40 shadow-inner ring-1 ring-slate-900/5 dark:ring-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer overflow-hidden"
                title={user?.name || 'Account Menu'}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="font-mono font-black text-xs text-slate-800 dark:text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/15 shadow-2xl py-2 z-50 animate-slide-up backdrop-blur-2xl font-sans">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
                        {user?.is_guest && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            Guest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate mt-0.5">{user?.email}</p>
                    </div>

                    {user?.is_guest && (
                      <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.08]">
                        <Link
                          to="/register"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-cyan-50 dark:bg-[#00e5ff]/10 hover:bg-cyan-100 dark:hover:bg-[#00e5ff]/20 text-cyan-700 dark:text-[#00e5ff] text-xs font-mono font-black border border-cyan-500/30 dark:border-[#00e5ff]/40 transition-all text-center"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Create Free Account</span>
                        </Link>
                      </div>
                    )}

                    <div className="py-1.5 text-xs font-bold">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-800 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-cyan-600 dark:text-[#00e5ff]" />
                        Dashboard
                      </Link>
                      <Link
                        to="/analytics"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-800 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
                      >
                        <Activity className="w-4 h-4 text-emerald-600 dark:text-[#00e676]" />
                        Analytics
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/[0.08] pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        {user?.is_guest ? 'Exit Guest Session' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Import Playlist Modal */}
      {isImportOpen && (
        <ImportPlaylistModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onSuccess={(playlistId) => {
            setIsImportOpen(false);
            navigate(`/playlist/${playlistId}`);
          }}
        />
      )}
    </>
  );
};

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl transition-all duration-300 select-none cursor-pointer group border ${
        isDark
          ? 'bg-[#0c1426]/80 hover:bg-[#13203c] border-white/10 text-amber-300 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 hover:border-indigo-400/40 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300 stroke-[2.2]" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300 stroke-[2.2]" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-mono font-bold tracking-tight">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

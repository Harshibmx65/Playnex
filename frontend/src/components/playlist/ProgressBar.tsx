import React from 'react';

interface ProgressBarProps {
  progressPercentage: number;
  completedVideos?: number;
  totalVideos?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  completedVideos,
  totalVideos,
  size = 'md',
  showLabel = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progressPercentage)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const getBarColor = () => {
    if (clamped >= 100) return 'bg-[#00e676]';
    if (clamped >= 50) return 'bg-[#00e5ff]';
    return 'bg-[#00b0ff]';
  };

  return (
    <div className="w-full font-mono">
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1 font-medium">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {completedVideos !== undefined && totalVideos !== undefined
              ? `${completedVideos} of ${totalVideos} completed`
              : 'Progress'}
          </span>
          <span className={`font-bold ${clamped === 100 ? 'text-emerald-600 dark:text-[#00e676]' : 'text-cyan-600 dark:text-[#00e5ff]'}`}>
            {clamped}%
          </span>
        </div>
      )}

      <div className={`w-full bg-slate-200 dark:bg-[#070b14] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.08] ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full ${getBarColor()} transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

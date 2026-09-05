import React from 'react';

interface PlaynexLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const PlaynexLogo: React.FC<PlaynexLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      box: 'px-2.5 py-1 rounded-lg text-xs gap-1.5',
      text: 'text-xs tracking-wider',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      box: 'px-3.5 py-1.5 rounded-xl text-sm sm:text-base gap-2',
      text: 'text-sm sm:text-base tracking-wider',
      dot: 'w-2 h-2',
    },
    lg: {
      box: 'px-6 py-2.5 rounded-2xl text-xl gap-2.5',
      text: 'text-xl sm:text-2xl tracking-widest',
      dot: 'w-2.5 h-2.5',
    },
  };

  const current = sizeClasses[size];

  return (
    <div className={`inline-flex items-center group cursor-pointer ${className}`}>
      {/* Curved Rectangular Box Logo */}
      <div
        className={`relative inline-flex items-center justify-center font-black ${current.box} bg-gradient-to-r from-[#0c1527] via-[#0f1d38] to-[#0c1527] border border-[#00e5ff]/40 shadow-lg shadow-cyan-500/15 group-hover:border-[#00e5ff] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.35)] group-hover:scale-[1.03] transition-all duration-300 select-none overflow-hidden`}
      >
        {/* Subtle Top Glass Rim Reflection */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Brand Text */}
        <span className={`font-black ${current.text} uppercase bg-gradient-to-r from-white via-cyan-100 to-[#00e5ff] bg-clip-text text-transparent group-hover:from-white group-hover:to-[#38f8ff] transition-all`}>
          PLAYNEX
        </span>

        {/* Inner Border Ring */}
        <span className="absolute inset-0 rounded-[inherit] ring-1 ring-white/10 pointer-events-none" />
      </div>
    </div>
  );
};


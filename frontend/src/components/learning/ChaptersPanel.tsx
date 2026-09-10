import React, { useMemo, useRef, useEffect } from 'react';
import { Play, Bookmark, Clock, CheckCircle2 } from 'lucide-react';
import { VideoChapter } from '../../utils/timestamps';

interface ChaptersPanelProps {
  chapters: VideoChapter[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const ChaptersPanel: React.FC<ChaptersPanelProps> = ({
  chapters,
  currentTime,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveIdxRef = useRef<number>(-1);

  if (!chapters || chapters.length === 0) {
    return null;
  }

  // Determine current active chapter based on playback position
  const activeChapterIndex = useMemo(() => {
    if (!chapters || chapters.length === 0) return -1;
    let currentIdx = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (currentTime >= chapters[i].timestamp) {
        currentIdx = i;
      } else {
        break;
      }
    }
    return currentIdx >= 0 ? currentIdx : 0;
  }, [chapters, currentTime]);

  // Only scroll into view when active chapter transitions
  useEffect(() => {
    if (
      activeChapterIndex >= 0 &&
      activeChapterIndex !== prevActiveIdxRef.current &&
      containerRef.current
    ) {
      prevActiveIdxRef.current = activeChapterIndex;
      const activeEl = containerRef.current.querySelector(
        `[data-chapter-index="${activeChapterIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeChapterIndex]);

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Creator Topics & Timestamps
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium">
              Click any topic to jump straight into playback
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-cyan-100 dark:bg-[#00e5ff]/10 text-cyan-900 dark:text-[#00e5ff] border border-cyan-300 dark:border-[#00e5ff]/30">
          {chapters.length} Topics
        </span>
      </div>

      {/* Chapters Timeline List */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {chapters.map((chapter, index) => {
          const isActive = index === activeChapterIndex;
          const nextTimestamp = index < chapters.length - 1 ? chapters[index + 1].timestamp : Infinity;
          const isPassed = currentTime >= nextTimestamp;

          return (
            <div
              key={`${chapter.timestamp}-${index}`}
              data-chapter-index={index}
              onClick={() => onSeek(chapter.timestamp)}
              className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border-2 flex items-center justify-between gap-3 group select-none ${
                isActive
                  ? 'bg-cyan-50 dark:bg-[#0f1d38] border-cyan-500 dark:border-[#00e5ff] shadow-md dark:shadow-lg dark:shadow-cyan-500/15 scale-[1.01]'
                  : isPassed
                  ? 'bg-slate-50/80 dark:bg-[#070b14]/70 border-slate-300 dark:border-white/[0.05] hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-[#0c1527]'
                  : 'bg-white dark:bg-[#0a1020] border-slate-300 dark:border-white/[0.08] hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-[#0c1527]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Timestamp Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(chapter.timestamp);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black shadow-sm'
                      : isPassed
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-[#0c1426] text-cyan-800 dark:text-[#00e5ff] border border-slate-300 dark:border-[#00e5ff]/30 group-hover:bg-cyan-50 dark:group-hover:bg-[#00e5ff]/20'
                  }`}
                  title={`Jump to ${chapter.timestamp_formatted}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{chapter.timestamp_formatted}</span>
                </button>

                {/* Chapter Topic Title */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs leading-snug transition-colors ${
                      isActive
                        ? 'text-slate-900 dark:text-white font-bold'
                        : isPassed
                        ? 'text-slate-700 dark:text-slate-300 font-semibold'
                        : 'text-slate-900 dark:text-slate-100 font-semibold group-hover:text-cyan-700 dark:group-hover:text-[#00e5ff]'
                    }`}
                  >
                    {chapter.title}
                  </p>
                  {isActive && (
                    <span className="text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#00e5ff] animate-ping" />
                      <span>Playing Now</span>
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`p-1.5 rounded-lg shrink-0 transition-all ${
                  isActive
                    ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black'
                    : isPassed
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-[#00e5ff]'
                }`}
              >
                {isPassed && !isActive ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

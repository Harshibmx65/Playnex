import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock3,
  RotateCw,
  Plus,
  SkipBack,
  SkipForward,
  HelpCircle,
  BookOpen,
  Tag as TagIcon,
  Check,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Video, Progress, Revision } from '../../types';
import { progressApi, revisionsApi } from '../../services/api';
import { formatSeconds } from '../../utils/format';
import { parseCreatorTimestamps } from '../../utils/timestamps';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  video: Video;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onSeekRequested?: (callback: (seconds: number) => void) => void;
  onPlaybackTimeChange?: (currentTime: number) => void;
  onOpenAddNote?: (currentTime: number) => void;
  onOpenAddDoubt?: (currentTime: number) => void;
  onOpenTags?: () => void;
  onVideoProgressUpdated?: (video: Video, progress: Progress) => void;
  onRevisionUpdated?: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  video,
  onNextVideo,
  onPrevVideo,
  hasNext = false,
  hasPrev = false,
  onSeekRequested,
  onPlaybackTimeChange,
  onOpenAddNote,
  onOpenAddDoubt,
  onOpenTags,
  onVideoProgressUpdated,
  onRevisionUpdated,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const stripScrollRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds || 0);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  
  // Chapter strip controls
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGridMode, setIsGridMode] = useState(false);

  // Parse video chapters/topics from description
  const chapters = useMemo(() => parseCreatorTimestamps(video.description), [video.description]);

  // Determine currently active chapter index
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

  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null;

  // Optimistic UI states for instant, responsive button clicks
  const [localStatus, setLocalStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>(
    (video.progress?.status as any) || 'NOT_STARTED'
  );
  const [localRevision, setLocalRevision] = useState<Revision | null | undefined>(video.revision);
  const [isRevisionMenuOpen, setIsRevisionMenuOpen] = useState(false);

  // Sync with prop changes when navigating between videos
  useEffect(() => {
    setLocalStatus((video.progress?.status as any) || 'NOT_STARTED');
    setLocalRevision(video.revision);
  }, [video.id, video.progress?.status, video.revision]);

  const isCompleted = localStatus === 'COMPLETED';
  const isInProgress = localStatus === 'IN_PROGRESS';
  const isMarkedRevision = Boolean(
    localRevision && ['NEED_REVISION', 'REVISING'].includes(localRevision.status)
  );

  // Pause helper
  const pauseVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Seek method for external calls and chapters
  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo();
        setCurrentTime(seconds);
        onPlaybackTimeChange?.(seconds);
        setIsPlaying(true);
      } catch (e) {
        console.error('Seek error:', e);
      }
    }
  }, [onPlaybackTimeChange]);

  // Jump to next / previous chapters
  const jumpNextChapter = useCallback(() => {
    if (chapters.length === 0) return;
    const nextIdx = Math.min(chapters.length - 1, (activeChapterIndex >= 0 ? activeChapterIndex + 1 : 0));
    seekTo(chapters[nextIdx].timestamp);
  }, [chapters, activeChapterIndex, seekTo]);

  const jumpPrevChapter = useCallback(() => {
    if (chapters.length === 0) return;
    const cur = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null;
    if (cur && currentTime - cur.timestamp > 3) {
      seekTo(cur.timestamp);
    } else {
      const prevIdx = Math.max(0, (activeChapterIndex >= 0 ? activeChapterIndex - 1 : 0));
      seekTo(chapters[prevIdx].timestamp);
    }
  }, [chapters, activeChapterIndex, currentTime, seekTo]);

  // Strip horizontal scroll detection
  const checkScroll = useCallback(() => {
    if (stripScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = stripScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = stripScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [chapters, checkScroll, isGridMode]);

  const scrollStrip = (direction: 'left' | 'right') => {
    if (stripScrollRef.current) {
      const amount = 320;
      stripScrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  // Smoothly auto-scroll active chapter into view in carousel strip mode
  useEffect(() => {
    if (activeChapterIndex >= 0 && !isGridMode && stripScrollRef.current) {
      const activeEl = stripScrollRef.current.querySelector(
        `[data-chapter-idx="${activeChapterIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [activeChapterIndex, isGridMode]);

  useEffect(() => {
    if (onSeekRequested) {
      onSeekRequested(seekTo);
    }
  }, [onSeekRequested, seekTo]);

  // Sync progress to backend API
  const syncProgress = useCallback(
    async (time: number, dur: number, forceStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
      if (!dur || dur <= 0) return;
      const pct = Math.min(100, Math.round((time / dur) * 100));

      try {
        const updated = await progressApi.update({
          video_id: video.id,
          last_position: time,
          watch_percentage: pct,
          status: forceStatus,
        });
        if (onVideoProgressUpdated) {
          onVideoProgressUpdated(video, updated);
        }
      } catch (err) {
        console.error('Failed to sync progress:', err);
      }
    },
    [video, onVideoProgressUpdated]
  );

  // Initialize YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
      }

      const startSeconds =
        video.progress && video.progress.status !== 'COMPLETED' && video.progress.last_position > 5
          ? Math.floor(video.progress.last_position)
          : 0;

      playerRef.current = new window.YT.Player(`yt-player-container-${video.id}`, {
        videoId: video.youtube_video_id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          start: startSeconds,
        },
        events: {
          onReady: (event: any) => {
            const playerDur = event.target.getDuration();
            if (playerDur) setDuration(playerDur);
            if (startSeconds > 0) {
              event.target.seekTo(startSeconds, true);
              setCurrentTime(startSeconds);
              onPlaybackTimeChange?.(startSeconds);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
              const cur = playerRef.current?.getCurrentTime?.() ?? 0;
              setCurrentTime(cur);
              onPlaybackTimeChange?.(cur);
            } else if (event.data === 2) {
              setIsPlaying(false);
              const cur = playerRef.current?.getCurrentTime?.() ?? 0;
              setCurrentTime(cur);
              onPlaybackTimeChange?.(cur);
              const dur = playerRef.current?.getDuration?.() || duration;
              syncProgress(cur, dur);
            } else if (event.data === 0) {
              setIsPlaying(false);
              setLocalStatus('COMPLETED');
              const dur = playerRef.current?.getDuration?.() || duration;
              syncProgress(dur, dur, 'COMPLETED');
              if (autoPlayNext && onNextVideo && hasNext) {
                onNextVideo();
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [video.id, onPlaybackTimeChange]);

  // Interval timer for tracking current playback position
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const t = playerRef.current.getCurrentTime();
          setCurrentTime(t);
          onPlaybackTimeChange?.(t);

          // Periodically sync every 8 seconds
          if (Math.floor(t) % 8 === 0) {
            const dur = playerRef.current.getDuration() || duration;
            syncProgress(t, dur);
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, syncProgress, onPlaybackTimeChange]);

  // Instant Toggle Completion
  const handleToggleComplete = async () => {
    const nextStatus = isCompleted ? 'NOT_STARTED' : 'COMPLETED';
    setLocalStatus(nextStatus);

    if (nextStatus === 'COMPLETED') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    try {
      const lastPos = nextStatus === 'COMPLETED' ? duration || video.duration_seconds : 0;
      const updated = await progressApi.update({
        video_id: video.id,
        status: nextStatus,
        watch_percentage: nextStatus === 'COMPLETED' ? 100 : 0,
        last_position: lastPos,
      });
      if (onVideoProgressUpdated) {
        onVideoProgressUpdated(video, updated);
      }
    } catch (err) {
      console.error('Failed to toggle completion status:', err);
      // Revert if error
      setLocalStatus(isCompleted ? 'COMPLETED' : 'NOT_STARTED');
    }
  };

  // Instant Toggle Revision
  const handleToggleRevision = async (priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') => {
    const willBeMarked = !isMarkedRevision;
    
    // Optimistic UI update
    if (willBeMarked) {
      setLocalRevision({
        id: localRevision?.id || 0,
        user_id: 0,
        video_id: video.id,
        status: 'NEED_REVISION',
        priority: priority,
        notes: `Flagged for revision @ ${formatSeconds(currentTime)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      setLocalRevision(null);
    }
    setIsRevisionMenuOpen(false);

    try {
      if (!willBeMarked) {
        await revisionsApi.removeFromRevision(video.id);
      } else {
        await revisionsApi.createOrUpdate({
          video_id: video.id,
          status: 'NEED_REVISION',
          priority: priority,
          notes: `Flagged for revision @ ${formatSeconds(currentTime)}`,
        });
      }
      if (onRevisionUpdated) onRevisionUpdated();
    } catch (err) {
      console.error('Failed to update revision status', err);
      setLocalRevision(video.revision);
    }
  };

  // Click Note Button: PAUSES video immediately and moves focus to Notes panel
  const handleAddNoteClick = () => {
    pauseVideo();
    const snapTime = currentTime;
    if (onOpenAddNote) {
      onOpenAddNote(snapTime);
    }
  };

  // Click Doubt Button: PAUSES video immediately and moves focus to Doubts panel
  const handleAddDoubtClick = () => {
    pauseVideo();
    const snapTime = currentTime;
    if (onOpenAddDoubt) {
      onOpenAddDoubt(snapTime);
    }
  };

  // Global Keyboard Shortcuts for player & topics navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not trigger if typing in an input, textarea, select, or editable element
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore modifier combinations like Ctrl+C, Cmd+R
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K': {
          e.preventDefault();
          if (playerRef.current) {
            if (isPlaying) {
              pauseVideo();
            } else {
              playerRef.current.playVideo?.();
              setIsPlaying(true);
            }
          }
          break;
        }
        case 'ArrowLeft':
        case 'j':
        case 'J': {
          e.preventDefault();
          const step = e.key.toLowerCase() === 'j' ? 10 : 5;
          const cur = playerRef.current?.getCurrentTime?.() ?? currentTime;
          seekTo(Math.max(0, cur - step));
          break;
        }
        case 'ArrowRight':
        case 'l':
        case 'L': {
          e.preventDefault();
          const step = e.key.toLowerCase() === 'l' ? 10 : 5;
          const cur = playerRef.current?.getCurrentTime?.() ?? currentTime;
          seekTo(Math.min(duration || video.duration_seconds || cur + 10, cur + step));
          break;
        }
        case '[': {
          e.preventDefault();
          jumpPrevChapter();
          break;
        }
        case ']': {
          e.preventDefault();
          jumpNextChapter();
          break;
        }
        case 'm':
        case 'M': {
          e.preventDefault();
          if (playerRef.current) {
            if (playerRef.current.isMuted?.()) {
              playerRef.current.unMute?.();
            } else {
              playerRef.current.mute?.();
            }
          }
          break;
        }
        case 'n':
        case 'N': {
          e.preventDefault();
          handleAddNoteClick();
          break;
        }
        case 'd':
        case 'D': {
          e.preventDefault();
          handleAddDoubtClick();
          break;
        }
        case 'c':
        case 'C': {
          e.preventDefault();
          handleToggleComplete();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    currentTime,
    duration,
    video.duration_seconds,
    pauseVideo,
    seekTo,
    jumpPrevChapter,
    jumpNextChapter,
    handleAddNoteClick,
    handleAddDoubtClick,
    handleToggleComplete
  ]);

  return (
    <div className="flex flex-col w-full space-y-4 font-sans">
      {/* 16:9 Responsive Video Player Container */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-slate-800/90">
        <div id={`yt-player-container-${video.id}`} className="w-full h-full" />
      </div>

      {/* Video Title, Position & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] shadow-md dark:shadow-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-cyan-100 dark:bg-[#00e5ff]/15 text-cyan-950 dark:text-[#00e5ff] border border-cyan-300 dark:border-[#00e5ff]/30 text-xs">
              LESSON #{video.position}
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
              {formatSeconds(currentTime)} / {formatSeconds(duration || video.duration_seconds)}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
            {video.title}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono">
          {/* Previous Video */}
          <button
            onClick={onPrevVideo}
            disabled={!hasPrev}
            className="p-2.5 rounded-xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#111b2f] hover:bg-slate-200 dark:hover:bg-[#1a2846] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-300 dark:border-[#17253f] shadow-sm"
            title="Previous Video"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Next Video */}
          <button
            onClick={onNextVideo}
            disabled={!hasNext}
            className="p-2.5 rounded-xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#111b2f] hover:bg-slate-200 dark:hover:bg-[#1a2846] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-300 dark:border-[#17253f] shadow-sm"
            title="Next Video"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* MARK COMPLETE TOGGLE BUTTON - High Visibility Active State */}
          <button
            onClick={handleToggleComplete}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border-2 active:scale-95 shadow-sm ${
              isCompleted
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-400 dark:ring-emerald-300'
                : isInProgress
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500 hover:bg-amber-200'
                : 'bg-white dark:bg-[#070b14] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
            title={isCompleted ? 'Click to unmark completed' : 'Mark video as completed'}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white fill-emerald-600 dark:fill-emerald-500" />
                <span>✓ Completed</span>
              </>
            ) : isInProgress ? (
              <>
                <Clock3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>In Progress</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" />
                <span>Mark Done</span>
              </>
            )}
          </button>

          {/* REVISE TOGGLE BUTTON - High Visibility Active State & Priority Menu */}
          <div className="relative flex items-center">
            <button
              onClick={() => handleToggleRevision(localRevision?.priority || 'MEDIUM')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-l-xl text-xs font-bold transition-all border-2 active:scale-95 shadow-sm ${
                isMarkedRevision
                  ? 'bg-amber-500 text-black border-amber-500 shadow-amber-500/25 ring-2 ring-amber-400'
                  : 'bg-white dark:bg-[#070b14] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15 hover:border-amber-500 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
              title={isMarkedRevision ? 'Click to remove from revision queue' : 'Add to revision queue'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isMarkedRevision ? 'text-black stroke-[3]' : 'text-slate-500'}`} />
              <span>{isMarkedRevision ? `✓ Revising (${localRevision?.priority || 'MED'})` : 'Revise'}</span>
            </button>

            {/* Dropdown chevron for priority selection */}
            <button
              onClick={() => setIsRevisionMenuOpen(!isRevisionMenuOpen)}
              className={`px-1.5 py-2 rounded-r-xl border-y-2 border-r-2 transition-all ${
                isMarkedRevision
                  ? 'bg-amber-600 text-black border-amber-500 hover:bg-amber-700'
                  : 'bg-slate-100 dark:bg-[#0c1426] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/15 hover:bg-slate-200'
              }`}
              title="Set revision priority level"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isRevisionMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsRevisionMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white dark:bg-[#0a1020] border-2 border-slate-300 dark:border-white/15 shadow-2xl p-2 z-30 animate-fade-in text-xs space-y-1 font-mono">
                  <div className="px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.08]">
                    Set Priority & Queue
                  </div>
                  <button
                    onClick={() => handleToggleRevision('HIGH')}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 font-bold"
                  >
                    <span>High Priority</span>
                    {localRevision?.priority === 'HIGH' && isMarkedRevision && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <button
                    onClick={() => handleToggleRevision('MEDIUM')}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15 font-bold"
                  >
                    <span>Medium Priority</span>
                    {localRevision?.priority === 'MEDIUM' && isMarkedRevision && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <button
                    onClick={() => handleToggleRevision('LOW')}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/15 font-bold"
                  >
                    <span>Low Priority</span>
                    {localRevision?.priority === 'LOW' && isMarkedRevision && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  {isMarkedRevision && (
                    <button
                      onClick={() => handleToggleRevision(localRevision?.priority || 'MEDIUM')}
                      className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-slate-100 dark:border-white/5 pt-1 font-semibold"
                    >
                      <span>Remove from queue</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* NOTE BUTTON: Pauses video and moves control to Add Note form at current timestamp */}
          <button
            onClick={handleAddNoteClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-100 hover:bg-cyan-200 dark:bg-[#00e5ff]/15 dark:hover:bg-[#00e5ff]/25 text-cyan-950 dark:text-[#00e5ff] border-2 border-cyan-300 dark:border-[#00e5ff]/40 transition-all active:scale-95 shadow-sm"
            title="Pause video and take note at this exact second (Key: N)"
          >
            <BookOpen className="w-4 h-4 text-cyan-700 dark:text-[#00e5ff]" />
            <span className="hidden sm:inline">Note @ {formatSeconds(currentTime)}</span>
            <span className="sm:hidden">Note</span>
          </button>

          {/* DOUBT BUTTON: Pauses video and moves control to Add Doubt form at current timestamp */}
          <button
            onClick={handleAddDoubtClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-950 dark:text-rose-400 border-2 border-rose-300 dark:border-rose-500/40 transition-all active:scale-95 shadow-sm"
            title="Pause video and log question at this exact second (Key: D)"
          >
            <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Doubt @ {formatSeconds(currentTime)}</span>
            <span className="sm:hidden">Doubt</span>
          </button>
        </div>
      </div>

      {/* Creator Timestamps Quick Jump Strip */}
      {chapters.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] space-y-3 animate-fade-in shadow-md dark:shadow-xl">
          {/* Header with Title, Shortcuts & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Topics & Chapters ({chapters.length})
                  </span>
                  {activeChapter && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-100 dark:bg-[#00e5ff]/15 text-cyan-900 dark:text-[#00e5ff] border border-cyan-300 dark:border-[#00e5ff]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-[#00e5ff] animate-pulse" />
                      #{activeChapterIndex + 1} Playing
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
                  Click any timestamp or use keys <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">[</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">]</kbd> to jump
                </p>
              </div>
            </div>

            {/* Prev / Next Topic & Grid Toggle Actions */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={jumpPrevChapter}
                disabled={activeChapterIndex <= 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#070b14] dark:hover:bg-[#122040] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                title="Jump to Previous Topic (Key: [)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev Topic</span>
              </button>

              <button
                type="button"
                onClick={jumpNextChapter}
                disabled={activeChapterIndex >= chapters.length - 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#070b14] dark:hover:bg-[#122040] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                title="Jump to Next Topic (Key: ])"
              >
                <span className="hidden sm:inline">Next Topic</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsGridMode(!isGridMode)}
                className={`p-1.5 rounded-xl border transition-all ${
                  isGridMode
                    ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black border-cyan-600 dark:border-[#00e5ff] font-bold'
                    : 'bg-slate-100 dark:bg-[#070b14] text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/10 hover:border-cyan-500/50'
                }`}
                title={isGridMode ? 'Switch to Horizontal Strip' : 'Expand All Topics in Grid'}
              >
                {isGridMode ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Topics Body (Carousel Strip or Grid View) */}
          {isGridMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 animate-fade-in custom-scrollbar">
              {chapters.map((ch, idx) => {
                const isCurrent = idx === activeChapterIndex;
                return (
                  <button
                    key={`${ch.timestamp}-${idx}`}
                    onClick={() => seekTo(ch.timestamp)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all border-2 group cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black font-bold shadow-md border-cyan-600 dark:border-[#00e5ff]'
                        : 'bg-slate-50 dark:bg-[#070b14] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:border-cyan-500 hover:bg-slate-100 dark:hover:bg-[#0c1527]'
                    }`}
                  >
                    <span
                      className={`px-2 py-1 rounded-lg font-mono font-black text-xs shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-black text-cyan-300 shadow-sm'
                          : 'bg-white dark:bg-[#0c1426] text-cyan-700 dark:text-[#00e5ff] border border-slate-200 dark:border-[#00e5ff]/30 group-hover:bg-cyan-50 dark:group-hover:bg-[#00e5ff]/20'
                      }`}
                    >
                      {ch.timestamp_formatted}
                    </span>
                    <span className="text-xs font-sans font-semibold line-clamp-2 leading-snug flex-1">
                      {ch.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="relative group/strip">
              {/* Left Scroll Arrow Button */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollStrip('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-[#0a1020]/95 shadow-lg border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white flex items-center justify-center hover:scale-110 hover:border-cyan-500 transition-all cursor-pointer backdrop-blur-sm"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {/* Horizontal Scroll Track */}
              <div
                ref={stripScrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scroll-smooth custom-scrollbar no-scrollbar-on-idle"
                style={{ scrollbarWidth: 'thin' }}
              >
                {chapters.map((ch, idx) => {
                  const isCurrent = idx === activeChapterIndex;

                  return (
                    <button
                      key={`${ch.timestamp}-${idx}`}
                      data-chapter-idx={idx}
                      onClick={() => seekTo(ch.timestamp)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono shrink-0 transition-all border-2 group cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black font-bold shadow-lg shadow-cyan-500/25 scale-[1.02] border-cyan-600 dark:border-[#00e5ff]'
                          : 'bg-slate-50 dark:bg-[#070b14] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/[0.08] hover:border-cyan-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0c1527] hover:scale-[1.01]'
                      }`}
                      title={`${ch.title} (Click to jump to ${ch.timestamp_formatted})`}
                    >
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-[11px] shrink-0 transition-all flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-black text-cyan-300 shadow-sm'
                            : 'bg-white dark:bg-[#0c1426] text-cyan-800 dark:text-[#00e5ff] border border-slate-200 dark:border-[#00e5ff]/30 group-hover:bg-cyan-50 dark:group-hover:bg-[#00e5ff]/20'
                        }`}
                      >
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                        <span>{ch.timestamp_formatted}</span>
                      </span>
                      <span className="text-xs truncate max-w-[220px] sm:max-w-[280px] font-sans font-semibold">
                        {ch.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Arrow Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollStrip('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-[#0a1020]/95 shadow-lg border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white flex items-center justify-center hover:scale-110 hover:border-cyan-500 transition-all cursor-pointer backdrop-blur-sm"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

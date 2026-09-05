import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  HelpCircle,
  RotateCw,
  BookOpen,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { PlaylistSummary } from '../../types';
import { ProgressBar } from './ProgressBar';
import { formatRelativeDate, formatTotalHours } from '../../utils/format';

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  onDelete?: (id: number) => void;
  onSync?: (id: number) => Promise<void> | void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onDelete, onSync }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!onSync) return;
    try {
      setIsSyncing(true);
      await onSync(playlist.id);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] hover:border-cyan-500/50 transition-all duration-200 overflow-hidden shadow-sm dark:shadow-lg hover:shadow-cyan-500/10">
      {/* Thumbnail Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 dark:bg-[#070b14]">
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 dark:bg-[#101b33] text-cyan-400 dark:text-[#00e5ff]">
            <Play className="w-10 h-10" />
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-[#0c1426] via-transparent to-transparent" />

        {/* Video count & complete length badge */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 dark:text-[#00e5ff] border border-white/10 flex items-center gap-1.5 shadow-md">
          <span>{playlist.total_videos} {playlist.total_videos === 1 ? 'VIDEO' : 'VIDEOS'}</span>
          {playlist.total_duration_seconds > 0 && (
            <>
              <span className="text-white/30">•</span>
              <span className="text-slate-100 font-semibold">{formatTotalHours(playlist.total_duration_seconds)}</span>
            </>
          )}
        </div>

        {/* Channel name badge */}
        {playlist.channel_name && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-200 dark:text-slate-300 border border-white/10 truncate max-w-[60%]">
            {playlist.channel_name}
          </div>
        )}

        {/* Play Overlay */}
        <Link
          to={`/playlist/${playlist.id}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs"
        >
          <div className="w-12 h-12 rounded-full bg-[#00e5ff] text-black flex items-center justify-center shadow-lg shadow-cyan-500/40">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/playlist/${playlist.id}`}>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-[#00e5ff] transition-colors line-clamp-1">
                {playlist.title}
              </h3>
            </Link>

            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                disabled={isSyncing}
                className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50"
                title="Options"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#0a1020] border border-slate-200 dark:border-white/10 shadow-xl py-1 z-20 font-mono text-xs animate-fade-in">
                    {onSync && (
                      <button
                        onClick={handleSyncClick}
                        className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-[#00e5ff] transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Sync with YouTube
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete(playlist.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Course
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {playlist.last_watched_video && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              <Clock className="w-3 h-3 text-cyan-600 dark:text-[#00e5ff] shrink-0" />
              <span className="truncate">Last: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{playlist.last_watched_video}</strong></span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <ProgressBar
          progressPercentage={playlist.progress_percentage}
          completedVideos={playlist.completed_videos}
          totalVideos={playlist.total_videos}
          size="sm"
        />

        {/* Footer Badges */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            {playlist.open_doubts_count > 0 && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold" title={`${playlist.open_doubts_count} open doubts`}>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{playlist.open_doubts_count}</span>
              </span>
            )}

            {playlist.revisions_count > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold" title={`${playlist.revisions_count} need revision`}>
                <RotateCw className="w-3.5 h-3.5" />
                <span>{playlist.revisions_count}</span>
              </span>
            )}

            {playlist.notes_count > 0 && (
              <span className="flex items-center gap-1 text-cyan-600 dark:text-[#00e5ff] font-medium" title={`${playlist.notes_count} notes`}>
                <BookOpen className="w-3.5 h-3.5" />
                <span>{playlist.notes_count}</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{playlist.completed_videos}/{playlist.total_videos}</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatRelativeDate(playlist.last_activity)}
          </span>
        </div>
      </div>
    </div>
  );
};

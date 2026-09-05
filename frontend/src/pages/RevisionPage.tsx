import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  CheckCircle2, 
  Calendar, 
  Play, 
  Trash2, 
  Flame, 
  Check, 
  Sparkles
} from 'lucide-react';
import { RevisionQueueItem, PlaylistSummary } from '../types';
import { revisionsApi, playlistsApi } from '../services/api';
import { formatRelativeDate, getPriorityBadge } from '../utils/format';

export const RevisionPage: React.FC = () => {
  const [revisions, setRevisions] = useState<RevisionQueueItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'REVISED' | 'ALL'>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRevisionFocusMode, setIsRevisionFocusMode] = useState(false);

  const fetchRevisions = async () => {
    setIsLoading(true);
    try {
      const data = await revisionsApi.getQueue({
        playlist_id: selectedPlaylistId || undefined,
        status_filter: statusFilter === 'ACTIVE' ? 'NEED_REVISION' : statusFilter === 'REVISED' ? 'REVISED' : undefined,
      });
      setRevisions(data);
    } catch (err) {
      console.error('Failed to load revision queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const data = await playlistsApi.getAll();
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to load playlists', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [selectedPlaylistId, statusFilter]);

  const handleMarkRevised = async (videoId: number) => {
    try {
      await revisionsApi.markRevised(videoId);
      setRevisions((prev) =>
        prev.map((r) =>
          r.video_id === videoId
            ? { ...r, status: 'REVISED', last_revised_at: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error('Failed to mark revised', err);
    }
  };

  const handleRemove = async (videoId: number) => {
    if (!confirm('Remove video from revision queue?')) return;
    try {
      await revisionsApi.removeFromRevision(videoId);
      setRevisions((prev) => prev.filter((r) => r.video_id !== videoId));
    } catch (err) {
      console.error('Failed to remove revision', err);
    }
  };

  const filteredRevisions = revisions.filter((r) => {
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Revision System & Queue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Prevent concept decay by revising flagged videos with spaced repetitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRevisionFocusMode(!isRevisionFocusMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              isRevisionFocusMode
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-[#0c1426] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRevisionFocusMode ? 'Exit Drill Mode' : 'Start Revision Focus'}</span>
          </button>
        </div>
      </div>

      {/* Focus Mode Banner */}
      {isRevisionFocusMode && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-mono font-black text-amber-800 dark:text-amber-300 text-sm">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>REVISION DRILL ACTIVE</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 max-w-xl">
            Going through flagged videos in rapid review mode. Click any card to launch straight into playback and solidify the concepts.
          </p>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0c1426] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08] font-mono text-xs">
          {(['ACTIVE', 'REVISED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'ACTIVE' ? 'Need Revision' : st === 'REVISED' ? 'Completed' : 'All'}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0c1426] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08] font-mono text-xs">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((pri) => (
            <button
              key={pri}
              onClick={() => setPriorityFilter(pri)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                priorityFilter === pri
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-[#00e5ff] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pri === 'ALL' ? 'All Priorities' : pri}
            </button>
          ))}
        </div>

        {/* Course Filter */}
        <select
          value={selectedPlaylistId || ''}
          onChange={(e) => setSelectedPlaylistId(e.target.value ? Number(e.target.value) : null)}
          className="px-3.5 py-2 bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono shadow-sm"
        >
          <option value="">All Courses ({playlists.length})</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Revision Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading revision queue...</p>
        </div>
      ) : filteredRevisions.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/60 dark:bg-[#0c1426]/50 p-8 space-y-2">
          <RotateCw className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Queue is clear</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'ACTIVE'
              ? 'No videos currently flagged for revision. Flag challenging videos during playback.'
              : 'No completed revisions found for this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRevisions.map((rev) => {
            const badge = getPriorityBadge(rev.priority);
            const isRevised = rev.status === 'REVISED';

            return (
              <div
                key={rev.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col justify-between space-y-3 group ${
                  isRevised
                    ? 'bg-white/70 dark:bg-[#0c1426]/60 border-slate-200 dark:border-white/[0.05] opacity-75'
                    : 'bg-white dark:bg-[#0c1426] border-slate-200 dark:border-white/[0.08] hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${badge.bg}`}>
                      {rev.priority} PRIORITY
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRemove(rev.video_id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Remove from revision"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link
                    to={`/playlist/${rev.playlist_id}?videoId=${rev.video_id}`}
                    className="block group/link"
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover/link:text-cyan-600 dark:group-hover/link:text-[#00e5ff] transition-colors line-clamp-2">
                      {rev.video_title}
                    </h3>
                  </Link>

                  {rev.playlist_title && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {rev.playlist_title}
                    </p>
                  )}

                  {rev.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-[#070b14] p-2 rounded-lg border border-slate-200 dark:border-white/5">
                      "{rev.notes}"
                    </p>
                  )}
                </div>

                {/* Actions & Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                    {rev.last_revised_at
                      ? `Revised ${formatRelativeDate(rev.last_revised_at)}`
                      : `Flagged ${formatRelativeDate(rev.created_at)}`}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      to={`/playlist/${rev.playlist_id}?videoId=${rev.video_id}`}
                      className="p-1.5 rounded-lg bg-cyan-50 dark:bg-[#00e5ff]/10 hover:bg-cyan-100 dark:hover:bg-[#00e5ff]/20 text-cyan-700 dark:text-[#00e5ff] border border-cyan-200 dark:border-[#00e5ff]/30 transition-colors"
                      title="Play video"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </Link>

                    <button
                      onClick={() => handleMarkRevised(rev.video_id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                        isRevised
                          ? 'bg-slate-100 dark:bg-[#070b14] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isRevised ? 'Revised' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

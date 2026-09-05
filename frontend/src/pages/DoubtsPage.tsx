import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  Play, 
  Trash2, 
  CheckCircle2, 
  MessageSquare
} from 'lucide-react';
import { Doubt, PlaylistSummary } from '../types';
import { doubtsApi, playlistsApi } from '../services/api';
import { formatRelativeDate, formatSeconds } from '../utils/format';

export const DoubtsPage: React.FC = () => {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Inline resolution editing
  const [resolvingDoubtId, setResolvingDoubtId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchDoubts = async () => {
    setIsLoading(true);
    try {
      const data = await doubtsApi.getAll({
        playlist_id: selectedPlaylistId || undefined,
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setDoubts(data);
    } catch (err) {
      console.error('Failed to load doubts', err);
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
    fetchDoubts();
  }, [selectedPlaylistId, statusFilter]);

  const handleToggleResolve = async (doubt: Doubt) => {
    if (doubt.status === 'OPEN') {
      setResolvingDoubtId(doubt.id);
      setResolutionNotes(doubt.resolution_notes || '');
    } else {
      try {
        const updated = await doubtsApi.toggleResolve(doubt.id);
        setDoubts((prev) => prev.map((d) => (d.id === doubt.id ? updated : d)));
      } catch (err) {
        console.error('Failed to toggle resolve', err);
      }
    }
  };

  const handleConfirmResolve = async (doubtId: number) => {
    try {
      const updated = await doubtsApi.update(doubtId, {
        status: 'RESOLVED',
        resolution_notes: resolutionNotes.trim() || undefined,
      });
      setDoubts((prev) => prev.map((d) => (d.id === doubtId ? updated : d)));
      setResolvingDoubtId(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to resolve doubt', err);
    }
  };

  const handleDeleteDoubt = async (doubtId: number) => {
    if (!confirm('Are you sure you want to delete this doubt?')) return;
    try {
      await doubtsApi.delete(doubtId);
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    } catch (err) {
      console.error('Failed to delete doubt', err);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.resolution_notes || '').toLowerCase().includes(q) ||
      (d.video_title || '').toLowerCase().includes(q) ||
      (d.playlist_title || '').toLowerCase().includes(q)
    );
  });

  const openCount = doubts.filter((d) => d.status === 'OPEN').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Doubt Resolution Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Timestamp-linked questions logged during course playback
            </p>
          </div>
        </div>

        {openCount > 0 && (
          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 self-start sm:self-auto">
            {openCount} Unresolved {openCount === 1 ? 'Doubt' : 'Doubts'}
          </span>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doubts by title, question, or course..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-[#0c1426] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08] font-mono text-xs">
          {(['OPEN', 'RESOLVED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-[#00e5ff] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'OPEN' ? 'Open' : tab === 'RESOLVED' ? 'Resolved' : 'All'}
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

      {/* Doubts List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading doubts...</p>
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/60 dark:bg-[#0c1426]/50 p-8 space-y-2">
          <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {statusFilter === 'OPEN' ? 'No open doubts' : 'No doubts found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'OPEN'
              ? 'Great job! You have cleared all doubts in your learning path.'
              : 'Log doubts while watching videos to review them later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => {
            const isResolved = doubt.status === 'RESOLVED';
            const isResolving = resolvingDoubtId === doubt.id;

            return (
              <div
                key={doubt.id}
                className={`p-5 rounded-2xl border transition-all shadow-sm ${
                  isResolved
                    ? 'bg-white/70 dark:bg-[#0c1426]/60 border-slate-200 dark:border-white/[0.05] opacity-80'
                    : 'bg-white dark:bg-[#0c1426] border-slate-200 dark:border-white/[0.08] hover:border-rose-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Tags & Timestamp */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            isResolved
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          }`}
                        >
                          {doubt.status}
                        </span>

                        <Link
                          to={`/playlist/${doubt.playlist_id}?videoId=${doubt.video_id}&t=${doubt.timestamp}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#070b14] hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
                        >
                          <span>@ {doubt.timestamp_formatted || formatSeconds(doubt.timestamp)}</span>
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </Link>

                        {doubt.playlist_title && (
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {doubt.playlist_title}
                          </span>
                        )}
                      </div>

                      {/* Video Title */}
                      {doubt.video_title && (
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {doubt.video_title}
                        </p>
                      )}

                      {/* Doubt Question */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {doubt.title}
                      </h3>

                      {doubt.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                          {doubt.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start shrink-0">
                      <button
                        onClick={() => handleToggleResolve(doubt)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                          isResolved
                            ? 'bg-slate-100 dark:bg-[#070b14] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isResolved ? 'Re-open Doubt' : 'Mark Resolved'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDoubt(doubt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete doubt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Resolution Notes Box if already resolved */}
                  {isResolved && doubt.resolution_notes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Resolution & Solution:</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                        {doubt.resolution_notes}
                      </p>
                    </div>
                  )}

                  {/* Inline Form to add resolution notes */}
                  {isResolving && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-cyan-300 dark:border-[#00e5ff]/30 space-y-3 animate-slide-up">
                      <label className="block text-xs font-mono font-semibold uppercase text-slate-700 dark:text-slate-300">
                        Attach Resolution & Solution Notes (Optional)
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Explain the solution or paste code so you remember how this was solved..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-[#0c1426] border border-slate-300 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setResolvingDoubtId(null)}
                          className="px-3 py-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmResolve(doubt.id)}
                          className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg shadow-sm"
                        >
                          Complete & Resolve
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timestamp Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    <span>Logged {formatRelativeDate(doubt.created_at)}</span>
                    {doubt.resolved_at && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Resolved {formatRelativeDate(doubt.resolved_at)}
                      </span>
                    )}
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

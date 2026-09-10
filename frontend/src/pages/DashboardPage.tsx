import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  RotateCw, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Activity, 
  ListVideo,
  ArrowRight
} from 'lucide-react';
import { DashboardStats, PlaylistSummary } from '../types';
import { analyticsApi, playlistsApi } from '../services/api';
import { PlaylistCard } from '../components/playlist/PlaylistCard';
import { ImportPlaylistModal } from '../components/playlist/ImportPlaylistModal';
import { formatSeconds, formatRelativeDate, getPriorityBadge } from '../utils/format';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashData, playlistsData] = await Promise.all([
        analyticsApi.getDashboard(),
        playlistsApi.getAll(),
      ]);
      setStats(dashData);
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeletePlaylist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course and all its notes and doubts?')) {
      return;
    }
    try {
      await playlistsApi.delete(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      const newDash = await analyticsApi.getDashboard();
      setStats(newDash);
    } catch (err) {
      console.error('Failed to delete playlist', err);
    }
  };

  const handleSyncPlaylist = async (id: number) => {
    try {
      await playlistsApi.sync(id);
      const [dashData, playlistsData] = await Promise.all([
        analyticsApi.getDashboard(),
        playlistsApi.getAll(),
      ]);
      setStats(dashData);
      setPlaylists(playlistsData);
    } catch (err: any) {
      console.error('Failed to sync playlist', err);
      alert(err.response?.data?.detail || 'Failed to sync playlist from YouTube');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">Synchronizing course telemetry...</p>
        </div>
      </div>
    );
  }

  const continueItem = stats?.continue_learning;
  const overallPct = stats?.overall_completion_percentage || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7 animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Learning <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-600 dark:from-[#00e5ff] dark:via-[#00f2fe] dark:to-[#00e676] bg-clip-text text-transparent">Telemetry & Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Monitor curriculum completion velocity, resolve technical doubts, and clear your revision queue.
          </p>
        </div>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-black bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Import Playlist</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Playlists */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-lg hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Courses</span>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 text-cyan-900 dark:text-[#00e5ff]">
              <ListVideo className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white">
              {stats?.total_playlists || 0}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block font-semibold">Active Playlists</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-lg hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400">
              {stats?.completed_videos || 0}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block font-semibold">Videos Mastered</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-lg hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 text-cyan-900 dark:text-[#00e5ff]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-800 dark:text-[#00e5ff]">
              {stats?.in_progress_videos || 0}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block font-semibold">Ongoing Lessons</span>
          </div>
        </div>

        {/* Doubts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-lg hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Doubts</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-900 dark:text-rose-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-rose-700 dark:text-rose-400">
              {stats?.open_doubts_count || 0}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block font-semibold">Open Questions</span>
          </div>
        </div>

        {/* Revision Queue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-lg hover:border-amber-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Revision</span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400">
              <RotateCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-700 dark:text-amber-400">
              {stats?.need_revision_count || 0}
            </div>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block font-semibold">Pending Drills</span>
          </div>
        </div>
      </div>

      {/* Continue Learning Hero Card */}
      {continueItem && (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] p-6 sm:p-7 shadow-md dark:shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase bg-cyan-100 dark:bg-[#00e5ff]/15 text-cyan-950 dark:text-[#00e5ff] border border-cyan-300 dark:border-[#00e5ff]/30">
                  Continue Watching
                </span>
                <span className="text-xs font-mono text-slate-800 dark:text-slate-200 font-bold truncate">
                  {continueItem.playlist_title}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white line-clamp-2">
                {continueItem.video_title}
              </h2>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-700 dark:text-slate-300 pt-1 font-semibold">
                <span>Last position: {formatSeconds(continueItem.last_position)}</span>
                <span>•</span>
                <span className="text-cyan-700 dark:text-[#00e5ff] font-bold">{Math.round(continueItem.watch_percentage)}% Completed</span>
              </div>
            </div>

            <Link
              to={`/playlist/${continueItem.playlist_id}?videoId=${continueItem.video_id}&t=${continueItem.last_position}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black font-mono font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all self-start lg:self-auto shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Playback</span>
            </Link>
          </div>
        </div>
      )}

      {/* Courses Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Your Courses ({playlists.length})
          </h2>
          <button
            onClick={() => setIsImportOpen(true)}
            className="text-xs font-mono font-bold text-cyan-700 dark:text-[#00e5ff] hover:underline flex items-center gap-1"
          >
            <span>+ Import Another</span>
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-[#0c1426]/50 p-8 space-y-3">
            <ListVideo className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No courses imported yet</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-sm mx-auto">
              Paste any public YouTube playlist URL to convert it into an interactive distraction-free learning course.
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="mt-2 px-5 py-2 text-xs font-bold font-mono bg-cyan-500 text-black rounded-xl shadow-md"
            >
              Import Your First Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onDelete={handleDeletePlaylist}
                onSync={handleSyncPlaylist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportPlaylistModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(id) => {
          setIsImportOpen(false);
          fetchDashboardData();
          navigate(`/playlist/${id}`);
        }}
      />
    </div>
  );
};

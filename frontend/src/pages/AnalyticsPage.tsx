import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock3, 
  ListVideo
} from 'lucide-react';
import { DashboardStats, PlaylistSummary } from '../types';
import { analyticsApi, playlistsApi } from '../services/api';
import { ProgressBar } from '../components/playlist/ProgressBar';
import { formatTotalHours } from '../utils/format';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashData, plData] = await Promise.all([
          analyticsApi.getDashboard(),
          playlistsApi.getAll(),
        ]);
        setStats(dashData);
        setPlaylists(plData);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Aggregating telemetry & progress...</p>
        </div>
      </div>
    );
  }

  const totalVideos = stats?.total_videos || 0;
  const completed = stats?.completed_videos || 0;
  const inProgress = stats?.in_progress_videos || 0;
  const notStarted = stats?.not_started_videos || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            Progress Analytics & Mastery
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-mono mt-0.5">
            High-level metrics of curriculum completion, study velocity, and revision habits.
          </p>
        </div>
      </div>

      {/* Primary KPI Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Completion Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-950 dark:text-white">{stats?.overall_completion_percentage || 0}%</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{completed} of {totalVideos} videos</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-[#070b14] rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300 dark:border-white/[0.12]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00e5ff] via-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${stats?.overall_completion_percentage || 0}%` }}
            />
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {stats?.completed_duration_formatted || '0h'} mastered out of {stats?.total_duration_formatted || '0h'} total across {stats?.total_playlists} courses.
          </p>
        </div>

        {/* Video States Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Status Distribution</span>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
              <span className="font-mono font-bold text-slate-950 dark:text-white">
                {completed} ({totalVideos ? Math.round((completed / totalVideos) * 100) : 0}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-cyan-700 dark:text-[#00e5ff] font-bold">
                <Clock3 className="w-3.5 h-3.5" />
                In Progress
              </span>
              <span className="font-mono font-bold text-slate-950 dark:text-white">
                {inProgress} ({totalVideos ? Math.round((inProgress / totalVideos) * 100) : 0}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                <ListVideo className="w-3.5 h-3.5" />
                Not Started
              </span>
              <span className="font-mono font-bold text-slate-950 dark:text-white">
                {notStarted} ({totalVideos ? Math.round((notStarted / totalVideos) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Focus & Memory Health */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Mastery & Recall</span>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-semibold">Pending Doubts</span>
              <span className={`font-mono font-bold ${stats?.open_doubts_count ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {stats?.open_doubts_count || 0} Open
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-200 font-semibold">Revision Queue</span>
              <span className={`font-mono font-bold ${stats?.need_revision_count ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {stats?.need_revision_count || 0} Flags
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 font-medium">
            Keep doubt count low and revision queue clear for maximum concept retention.
          </div>
        </div>
      </div>

      {/* Per Course Detailed Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Course-by-Course Progress</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg space-y-3 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/playlist/${pl.id}`}
                    className="text-sm font-bold text-slate-950 dark:text-white hover:text-cyan-600 dark:hover:text-[#00e5ff] transition-colors truncate block"
                  >
                    {pl.title}
                  </Link>
                  {pl.channel_name && (
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-mono font-medium mt-0.5 block truncate">
                      {pl.channel_name}
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono font-bold text-cyan-800 dark:text-[#00e5ff] bg-cyan-100 dark:bg-[#00e5ff]/15 px-3 py-1 rounded-lg border border-cyan-300 dark:border-[#00e5ff]/30 shrink-0">
                  {Math.round(pl.progress_percentage)}%
                </span>
              </div>

              <ProgressBar
                progressPercentage={pl.progress_percentage}
                completedVideos={pl.completed_videos}
                totalVideos={pl.total_videos}
                size="md"
              />

              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-mono font-medium pt-1">
                <span>
                  {pl.completed_videos} of {pl.total_videos} completed {pl.total_duration_seconds ? `• ${formatTotalHours(pl.total_duration_seconds)}` : ''}
                </span>
                <Link
                  to={`/playlist/${pl.id}`}
                  className="text-cyan-700 dark:text-[#00e5ff] hover:underline font-bold"
                >
                  Open Player →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

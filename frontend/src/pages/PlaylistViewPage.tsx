import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  HelpCircle, 
  RotateCw, 
  BookOpen, 
  Tag as TagIcon, 
  ListVideo, 
  Search,
  Bookmark,
  Clock
} from 'lucide-react';
import { PlaylistDetail, Video, VideoDetail } from '../types';
import { playlistsApi, videosApi } from '../services/api';
import { YouTubePlayer } from '../components/player/YouTubePlayer';
import { NotesPanel } from '../components/learning/NotesPanel';
import { DoubtsPanel } from '../components/learning/DoubtsPanel';
import { TagsManager } from '../components/learning/TagsManager';
import { RevisionPanel } from '../components/learning/RevisionPanel';
import { ChaptersPanel } from '../components/learning/ChaptersPanel';
import { ProgressBar } from '../components/playlist/ProgressBar';
import { formatSeconds, formatTotalHours } from '../utils/format';
import { parseCreatorTimestamps } from '../utils/timestamps';

export const PlaylistViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const playlistId = Number(id);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoDetail | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'doubts' | 'tags' | 'revision' | 'chapters'>('notes');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Triggers to instantly activate add form with timestamp in Notes and Doubts panels
  const [addNoteTrigger, setAddNoteTrigger] = useState<{ timestamp: number; key: number } | null>(null);
  const [addDoubtTrigger, setAddDoubtTrigger] = useState<{ timestamp: number; key: number } | null>(null);

  // Search, tag, and status filters for curriculum
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'DOUBT' | 'REVISION'>('ALL');

  // Callback to seek player
  const seekFunctionRef = useRef<((seconds: number) => void) | null>(null);

  // Load Playlist Data
  const loadPlaylist = async () => {
    if (!playlistId) return;
    try {
      const data = await playlistsApi.getById(playlistId);
      setPlaylist(data);

      const requestedVideoId = searchParams.get('videoId');
      let targetVideo: Video | undefined;

      if (requestedVideoId) {
        targetVideo = data.videos.find((v: Video) => v.id === Number(requestedVideoId));
      }

      if (!targetVideo) {
        targetVideo = data.videos.find((v: Video) => v.progress?.status === 'IN_PROGRESS') ||
                      data.videos.find((v: Video) => v.progress?.status === 'NOT_STARTED') ||
                      data.videos[0];
      }

      if (targetVideo) {
        const fullVideo = await videosApi.getDetail(targetVideo.id);
        setCurrentVideo(fullVideo);
      }
    } catch (err) {
      console.error('Failed to load playlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCourse = async () => {
    if (!playlistId || isSyncing) return;
    try {
      setIsSyncing(true);
      const updated = await playlistsApi.sync(playlistId);
      setPlaylist(updated);
      if (currentVideo) {
        const stillExists = updated.videos.find((v) => v.id === currentVideo.id);
        if (stillExists) {
          const freshVid = await videosApi.getDetail(stillExists.id);
          setCurrentVideo(freshVid);
        } else if (updated.videos.length > 0) {
          const freshVid = await videosApi.getDetail(updated.videos[0].id);
          setCurrentVideo(freshVid);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync playlist', err);
      alert(err.response?.data?.detail || 'Failed to sync playlist from YouTube');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  // Handle URL query changes for videoId
  useEffect(() => {
    const requestedVideoId = searchParams.get('videoId');
    if (requestedVideoId && playlist) {
      const vidId = Number(requestedVideoId);
      if (currentVideo?.id !== vidId) {
        videosApi.getDetail(vidId).then((fullVid) => {
          setCurrentVideo(fullVid);
        });
      }
    }
  }, [searchParams]);

  const handleSelectVideo = async (video: Video) => {
    setSearchParams({ videoId: video.id.toString() });
    try {
      const full = await videosApi.getDetail(video.id);
      setCurrentVideo(full);
      if (full.progress && full.progress.last_position > 5 && seekFunctionRef.current) {
        seekFunctionRef.current(full.progress.last_position);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextVideo = () => {
    if (!playlist || !currentVideo) return;
    const currentIndex = playlist.videos.findIndex((v: Video) => v.id === currentVideo.id);
    if (currentIndex < playlist.videos.length - 1) {
      handleSelectVideo(playlist.videos[currentIndex + 1]);
    }
  };

  const handlePrevVideo = () => {
    if (!playlist || !currentVideo) return;
    const currentIndex = playlist.videos.findIndex((v: Video) => v.id === currentVideo.id);
    if (currentIndex > 0) {
      handleSelectVideo(playlist.videos[currentIndex - 1]);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentPlaybackTime(seconds);
    if (seekFunctionRef.current) {
      seekFunctionRef.current(seconds);
    }
  };

  // Filtered video curriculum
  const filteredVideos = (playlist?.videos || []).filter((v: Video) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!v.title.toLowerCase().includes(q)) return false;
    }

    if (statusFilter === 'COMPLETED' && v.progress?.status !== 'COMPLETED') return false;
    if (statusFilter === 'IN_PROGRESS' && v.progress?.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'NOT_STARTED' && v.progress?.status !== 'NOT_STARTED') return false;
    if (statusFilter === 'DOUBT' && v.open_doubts_count === 0) return false;
    if (statusFilter === 'REVISION' && !v.revision) return false;

    return true;
  });

  const creatorChapters = React.useMemo(() => {
    return parseCreatorTimestamps(currentVideo?.description);
  }, [currentVideo?.description]);

  useEffect(() => {
    if (activeTab === 'chapters' && creatorChapters.length === 0) {
      setActiveTab('notes');
    }
  }, [creatorChapters, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Initializing distraction-free player workspace...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <Link to="/dashboard" className="text-xs text-cyan-600 dark:text-[#00e5ff] hover:underline font-mono">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentIndex = playlist.videos.findIndex((v: Video) => v.id === currentVideo?.id);
  const hasNext = currentIndex < playlist.videos.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Top Breadcrumbs & Playlist Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2.5 rounded-2xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20 transition-all shrink-0 shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-cyan-700 dark:text-[#00e5ff] uppercase">
              <span>{playlist.channel_name || 'YouTube Course'}</span>
              <span>•</span>
              <span>{playlist.total_videos} {playlist.total_videos === 1 ? 'Video' : 'Videos'}</span>
              {playlist.total_duration_seconds > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 normal-case text-slate-700 dark:text-slate-300 font-bold">
                    <Clock className="w-3 h-3 text-cyan-600 dark:text-[#00e5ff]" />
                    {formatTotalHours(playlist.total_duration_seconds)} Total
                  </span>
                </>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white line-clamp-1 tracking-tight">
              {playlist.title}
            </h1>
          </div>
        </div>

        {/* Course Progress Metric Bar & Sync Button */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-[240px]">
          <div className="flex-1">
            <ProgressBar
              progressPercentage={playlist.progress_percentage}
              completedVideos={playlist.completed_videos}
              totalVideos={playlist.total_videos}
              size="sm"
            />
          </div>

          <button
            onClick={handleSyncCourse}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white dark:bg-[#0c1426] border border-slate-300 dark:border-white/10 hover:border-cyan-500 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-[#00e5ff] shadow-xs transition-all disabled:opacity-50 shrink-0"
            title="Sync latest videos from YouTube"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-500' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (YouTube Video Player & Toolbar) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {currentVideo ? (
            <YouTubePlayer
              video={currentVideo}
              onNextVideo={handleNextVideo}
              onPrevVideo={handlePrevVideo}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onSeekRequested={(cb) => {
                seekFunctionRef.current = cb;
              }}
              onPlaybackTimeChange={setCurrentPlaybackTime}
              onOpenAddNote={(sec) => {
                setActiveTab('notes');
                setAddNoteTrigger({ timestamp: sec, key: Date.now() });
              }}
              onOpenAddDoubt={(sec) => {
                setActiveTab('doubts');
                setAddDoubtTrigger({ timestamp: sec, key: Date.now() });
              }}
              onOpenTags={() => setActiveTab('tags')}
              onVideoProgressUpdated={() => {
                playlistsApi.getById(playlistId).then(setPlaylist);
              }}
              onRevisionUpdated={() => {
                videosApi.getDetail(currentVideo.id).then(setCurrentVideo);
                playlistsApi.getById(playlistId).then(setPlaylist);
              }}
            />
          ) : (
            <div className="aspect-video w-full rounded-3xl bg-slate-100 dark:bg-[#0c1426] flex items-center justify-center text-slate-500 font-mono text-xs border-2 border-slate-300 dark:border-white/[0.08]">
              No video selected
            </div>
          )}
        </div>

        {/* Right Column (Secondary Learning Management Panel) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[500px] max-h-[660px] rounded-3xl bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-2xl">
          {/* Tab Selector Buttons */}
          <div className={`grid ${creatorChapters.length > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-1 p-1 bg-slate-100 dark:bg-[#080d1a] rounded-2xl border border-slate-300 dark:border-white/[0.08] mb-4 shrink-0 font-sans`}>
            {creatorChapters.length > 0 && (
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'chapters'
                    ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black shadow-sm'
                    : 'text-cyan-800 dark:text-[#00e5ff] hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Creator Video Chapters & Topics"
              >
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Topics</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black shadow-md'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('doubts')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'doubts'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Doubts</span>
            </button>

            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tags'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags</span>
            </button>

            <button
              onClick={() => setActiveTab('revision')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'revision'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Revise</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {currentVideo && (
              <>
                {activeTab === 'chapters' && creatorChapters.length > 0 && (
                  <ChaptersPanel
                    chapters={creatorChapters}
                    currentTime={currentPlaybackTime}
                    onSeek={handleSeek}
                  />
                )}

                {activeTab === 'notes' && (
                  <NotesPanel
                    video={currentVideo}
                    currentPlaybackTime={currentPlaybackTime}
                    onSeek={handleSeek}
                    externalAddTrigger={addNoteTrigger}
                    onNotesCountChanged={() => {
                      videosApi.getDetail(currentVideo.id).then(setCurrentVideo);
                      playlistsApi.getById(playlistId).then(setPlaylist);
                    }}
                  />
                )}

                {activeTab === 'doubts' && (
                  <DoubtsPanel
                    video={currentVideo}
                    currentPlaybackTime={currentPlaybackTime}
                    onSeek={handleSeek}
                    externalAddTrigger={addDoubtTrigger}
                    onDoubtsCountChanged={() => {
                      videosApi.getDetail(currentVideo.id).then(setCurrentVideo);
                      playlistsApi.getById(playlistId).then(setPlaylist);
                    }}
                  />
                )}

                {activeTab === 'tags' && (
                  <TagsManager
                    video={currentVideo}
                    onTagsUpdated={() => {
                      videosApi.getDetail(currentVideo.id).then(setCurrentVideo);
                      playlistsApi.getById(playlistId).then(setPlaylist);
                    }}
                  />
                )}

                {activeTab === 'revision' && (
                  <RevisionPanel
                    video={currentVideo}
                    onRevisionUpdated={() => {
                      videosApi.getDetail(currentVideo.id).then(setCurrentVideo);
                      playlistsApi.getById(playlistId).then(setPlaylist);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum / Video List Header */}
      <div className="space-y-4 pt-6 border-t-2 border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Course <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-[#00e5ff] dark:to-[#00e676] bg-clip-text text-transparent">Curriculum & Lessons</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Click any lesson to jump immediately. Track individual notes, questions, and revision priorities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0c1426] p-1 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-mono shadow-sm">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'ALL' ? 'bg-cyan-500 dark:bg-[#00e5ff] text-black font-bold shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Done
              </button>
              <button
                onClick={() => setStatusFilter('DOUBT')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'DOUBT' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Doubts
              </button>
              <button
                onClick={() => setStatusFilter('REVISION')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'REVISION' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Revise
              </button>
            </div>
          </div>
        </div>

        {/* Video List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVideos.map((vid: Video) => {
            const isSelected = vid.id === currentVideo?.id;
            const isDone = vid.progress?.status === 'COMPLETED';
            const isInProg = vid.progress?.status === 'IN_PROGRESS';
            const hasDoubts = vid.open_doubts_count > 0;
            const needsRevise = !!vid.revision;

            return (
              <div
                key={vid.id}
                onClick={() => handleSelectVideo(vid)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-3 border-2 ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-[#101b33] border-cyan-500 dark:border-[#00e5ff] shadow-md dark:shadow-cyan-500/10 scale-[1.01]'
                    : 'bg-white dark:bg-[#0c1426] border-slate-300/90 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-[#101a30] shadow-sm'
                }`}
              >
                {/* Position & Thumbnail */}
                <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-slate-900 dark:bg-[#080d1a] shrink-0 border border-slate-300 dark:border-white/10">
                  {vid.thumbnail ? (
                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <ListVideo className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/90 rounded font-mono text-[10px] font-bold text-white border border-white/20">
                    {formatSeconds(vid.duration_seconds)}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-cyan-700 dark:text-[#00e5ff]">#{vid.position}</span>
                    {isDone && <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Done</span>}
                    {isInProg && <span className="text-amber-700 dark:text-amber-400 font-bold">⏳ {Math.round(vid.progress?.watch_percentage || 0)}%</span>}
                  </div>
                  <h4 className={`text-xs font-semibold line-clamp-2 ${isSelected ? 'text-cyan-900 dark:text-[#00e5ff] font-bold' : 'text-slate-900 dark:text-white'}`}>
                    {vid.title}
                  </h4>

                  {/* Micro Badges */}
                  <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono">
                    {hasDoubts && (
                      <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-0.5">
                        <HelpCircle className="w-3 h-3" />
                        <span>{vid.open_doubts_count}</span>
                      </span>
                    )}
                    {needsRevise && (
                      <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-0.5">
                        <RotateCw className="w-3 h-3" />
                        <span>Revise</span>
                      </span>
                    )}
                    {vid.notes_count > 0 && (
                      <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-0.5">
                        <BookOpen className="w-3 h-3 text-cyan-600 dark:text-[#00e5ff]" />
                        <span>{vid.notes_count}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

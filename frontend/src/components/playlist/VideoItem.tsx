import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock3, 
  HelpCircle, 
  RotateCw, 
  BookOpen, 
  Play,
  Flame
} from 'lucide-react';
import { Video } from '../../types';
import { getTagColorClasses } from '../../utils/format';

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  onSelect: (video: Video) => void;
  onToggleComplete?: (videoId: number, e: React.MouseEvent) => void;
}

export const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isActive,
  onSelect,
  onToggleComplete,
}) => {
  const status = video.progress?.status || 'NOT_STARTED';
  const watchPct = video.progress?.watch_percentage || 0;
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  const hasOpenDoubt = video.open_doubts_count > 0;
  const needsRevision = video.revision && ['NEED_REVISION', 'REVISING'].includes(video.revision.status);

  return (
    <div
      onClick={() => onSelect(video)}
      className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isActive
          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50'
          : 'bg-dark-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Active Pulse Bar Indicator */}
      {isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full" />
      )}

      {/* Completion Status Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete && onToggleComplete(video.id, e);
        }}
        className="shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
        ) : isInProgress ? (
          <Clock3 className="w-5 h-5 text-amber-400 fill-amber-500/20" />
        ) : (
          <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
        )}
      </button>

      {/* Thumbnail + Duration */}
      <div className="relative w-24 sm:w-28 aspect-video shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
        <img
          src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-medium text-slate-200 backdrop-blur-xs">
          {video.duration || '00:00'}
        </span>

        {/* Hover play icon */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Mini progress bar under thumbnail if in progress */}
        {isInProgress && watchPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div className="h-full bg-amber-400" style={{ width: `${watchPct}%` }} />
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            #{video.position}
          </span>

          {/* Indicators Badges */}
          {hasOpenDoubt && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30" title="Open Doubt">
              <HelpCircle className="w-3 h-3" />
              <span>Doubt</span>
            </span>
          )}

          {needsRevision && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30" title="Needs Revision">
              <RotateCw className="w-3 h-3" />
              <span>Revise</span>
            </span>
          )}

          {video.notes_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400" title={`${video.notes_count} notes`}>
              <BookOpen className="w-3 h-3" />
              <span>{video.notes_count}</span>
            </span>
          )}
        </div>

        <h4 className={`text-xs sm:text-sm font-semibold line-clamp-2 transition-colors ${
          isActive ? 'text-indigo-300' : isCompleted ? 'text-slate-400' : 'text-slate-200 group-hover:text-white'
        }`}>
          {video.title}
        </h4>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {video.tags.slice(0, 3).map((tag) => {
              const colors = getTagColorClasses(tag.color);
              return (
                <span
                  key={tag.id}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                >
                  {tag.name}
                </span>
              );
            })}
            {video.tags.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

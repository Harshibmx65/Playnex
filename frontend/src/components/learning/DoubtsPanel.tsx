import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  Save, 
  MessageSquare
} from 'lucide-react';
import { Video, Doubt } from '../../types';
import { doubtsApi } from '../../services/api';
import { formatSeconds } from '../../utils/format';

interface DoubtsPanelProps {
  video: Video;
  currentPlaybackTime: number;
  onSeek: (seconds: number) => void;
  onDoubtsCountChanged?: () => void;
  externalAddTrigger?: { timestamp: number; key: number } | null;
}

export const DoubtsPanel: React.FC<DoubtsPanelProps> = ({
  video,
  currentPlaybackTime,
  onSeek,
  onDoubtsCountChanged,
  externalAddTrigger,
}) => {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [resolvingDoubtId, setResolvingDoubtId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Add form state
  const [timestamp, setTimestamp] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDoubts = async () => {
    setIsLoading(true);
    try {
      const all = await doubtsApi.getAll({ playlist_id: video.playlist_id });
      const videoDoubts = all.filter((d) => d.video_id === video.id);
      setDoubts(videoDoubts);
    } catch (err) {
      console.error('Failed to load doubts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [video.id]);

  // When external trigger arrives (e.g. from clicking Doubt button in player toolbar)
  useEffect(() => {
    if (externalAddTrigger) {
      setTimestamp(externalAddTrigger.timestamp);
      setTitle('');
      setDescription('');
      setIsAdding(true);
      setResolvingDoubtId(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [externalAddTrigger]);

  const handleStartAdd = () => {
    setTimestamp(currentPlaybackTime);
    setTitle('');
    setDescription('');
    setIsAdding(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const handleSaveDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const created = await doubtsApi.create({
        video_id: video.id,
        timestamp: timestamp,
        timestamp_formatted: formatSeconds(timestamp),
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setDoubts((prev) => [created, ...prev]);
      setIsAdding(false);
      setTitle('');
      setDescription('');
      if (onDoubtsCountChanged) onDoubtsCountChanged();
    } catch (err) {
      console.error('Failed to create doubt', err);
    }
  };

  const handleToggleResolve = async (doubt: Doubt) => {
    if (doubt.status === 'OPEN') {
      setResolvingDoubtId(doubt.id);
      setResolutionNotes('');
    } else {
      try {
        const updated = await doubtsApi.toggleResolve(doubt.id);
        setDoubts((prev) => prev.map((d) => (d.id === doubt.id ? updated : d)));
        if (onDoubtsCountChanged) onDoubtsCountChanged();
      } catch (err) {
        console.error('Failed to reopen doubt', err);
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
      if (onDoubtsCountChanged) onDoubtsCountChanged();
    } catch (err) {
      console.error('Failed to resolve doubt', err);
    }
  };

  const handleDeleteDoubt = async (doubtId: number) => {
    try {
      await doubtsApi.delete(doubtId);
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
      if (onDoubtsCountChanged) onDoubtsCountChanged();
    } catch (err) {
      console.error('Failed to delete doubt', err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between font-mono pb-2 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Video Doubts</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/15 text-rose-900 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
            {doubts.length}
          </span>
        </div>

        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Doubt @ {formatSeconds(currentPlaybackTime)}</span>
          </button>
        )}
      </div>

      {/* Add Doubt Form */}
      {isAdding && (
        <form onSubmit={handleSaveDoubt} className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-rose-400 dark:border-rose-500/40 space-y-3 animate-slide-up shadow-lg font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08] text-xs text-rose-700 dark:text-rose-400 font-bold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>DOUBT AT TIMESTAMP: {formatSeconds(timestamp)}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question or confusion at this point?"
            required
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            autoFocus
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context or code snippet (optional)..."
            rows={2}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none font-sans"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Doubt</span>
            </button>
          </div>
        </form>
      )}

      {/* Doubts List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading doubts...</div>
        ) : doubts.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/[0.08] p-6 space-y-2 bg-slate-50/50 dark:bg-transparent">
            <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-900 dark:text-slate-100 font-bold">No doubts logged for this video</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xs mx-auto">
              Click the "Doubt @ 00:00" button under the player or "+ Log Doubt" to pause and record questions.
            </p>
          </div>
        ) : (
          doubts.map((doubt) => {
            const isResolved = doubt.status === 'RESOLVED';
            const isResolving = resolvingDoubtId === doubt.id;

            return (
              <div
                key={doubt.id}
                className={`p-4 rounded-2xl border-2 space-y-2.5 transition-all shadow-sm ${
                  isResolved
                    ? 'bg-slate-50 dark:bg-[#0c1426]/60 border-slate-300 dark:border-white/[0.05] opacity-90'
                    : 'bg-white dark:bg-[#0c1426] border-slate-300 dark:border-white/[0.08] hover:border-rose-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Timestamp chip */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSeek(doubt.timestamp)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-950 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-xs font-mono font-bold transition-colors"
                      title="Jump to video timestamp"
                    >
                      <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{doubt.timestamp_formatted || formatSeconds(doubt.timestamp)}</span>
                    </button>

                    <span
                      className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-rose-100 dark:bg-rose-500/15 text-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                      }`}
                    >
                      {doubt.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleResolve(doubt)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isResolved
                          ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      }`}
                      title={isResolved ? 'Re-open doubt' : 'Mark resolved'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoubt(doubt.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      title="Delete doubt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className={`text-xs font-bold ${isResolved ? 'text-slate-600 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                  {doubt.title}
                </h4>

                {doubt.description && (
                  <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                    {doubt.description}
                  </p>
                )}

                {/* Resolution Notes Display */}
                {isResolved && doubt.resolution_notes && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Resolution:</span>
                    </div>
                    <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-sans">{doubt.resolution_notes}</p>
                  </div>
                )}

                {/* Inline Resolve Form */}
                {isResolving && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#070b14] border-2 border-cyan-400 dark:border-cyan-500/30 space-y-2 animate-slide-up font-mono">
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add solution or explanation notes..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-sans"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setResolvingDoubtId(null)}
                        className="px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 font-bold hover:text-slate-900 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmResolve(doubt.id)}
                        className="px-3.5 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg shadow-sm"
                      >
                        Confirm Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

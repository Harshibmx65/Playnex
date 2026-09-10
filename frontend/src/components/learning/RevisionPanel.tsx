import React, { useState } from 'react';
import { 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Trash2, 
  Check, 
  Sparkles,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Video, Revision } from '../../types';
import { revisionsApi } from '../../services/api';
import { formatRelativeDate, getPriorityBadge } from '../../utils/format';

interface RevisionPanelProps {
  video: Video;
  onRevisionUpdated: () => void;
}

export const RevisionPanel: React.FC<RevisionPanelProps> = ({
  video,
  onRevisionUpdated,
}) => {
  const revision = video.revision;
  const isMarked = !!revision;

  const [status, setStatus] = useState<string>(revision?.status || 'NEED_REVISION');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(
    revision?.priority || 'MEDIUM'
  );
  const [notes, setNotes] = useState<string>(revision?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRevision = async (newStatus?: string) => {
    setIsSaving(true);
    try {
      await revisionsApi.createOrUpdate({
        video_id: video.id,
        status: (newStatus || status) as any,
        priority: priority,
        notes: notes.trim() || undefined,
      });

      if (newStatus === 'REVISED') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      onRevisionUpdated();
    } catch (err) {
      console.error('Failed to update revision', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRevision = async () => {
    try {
      await revisionsApi.removeFromRevision(video.id);
      onRevisionUpdated();
    } catch (err) {
      console.error('Failed to remove revision', err);
    }
  };

  const handleMarkRevised = async () => {
    try {
      await revisionsApi.markRevised(video.id);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onRevisionUpdated();
    } catch (err) {
      console.error('Failed to mark revised', err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Revision System</h3>
          {isMarked && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityBadge(revision?.priority).bg}`}>
              {revision?.priority} Priority
            </span>
          )}
        </div>

        {isMarked && revision?.status !== 'REVISED' && (
          <button
            onClick={handleMarkRevised}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark Revised</span>
          </button>
        )}
      </div>

      {/* Revision Form Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] space-y-4 shadow-sm">
        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 mb-2">
            Priority Queue Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all border ${
                  priority === p
                    ? p === 'HIGH'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-400 shadow-sm'
                      : p === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400 shadow-sm'
                      : 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400 shadow-sm'
                    : 'bg-white dark:bg-[#070b14] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 mb-2">
            Recall Status
          </label>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setStatus('NEED_REVISION')}
              className={`py-2 px-3 rounded-xl font-bold transition-all border ${
                status === 'NEED_REVISION'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-400 shadow-sm'
                  : 'bg-white dark:bg-[#070b14] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/[0.08]'
              }`}
            >
              Need Revision
            </button>
            <button
              type="button"
              onClick={() => setStatus('REVISED')}
              className={`py-2 px-3 rounded-xl font-bold transition-all border ${
                status === 'REVISED'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-400 shadow-sm'
                  : 'bg-white dark:bg-[#070b14] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/[0.08]'
              }`}
            >
              Mastered / Revised
            </button>
          </div>
        </div>

        {/* Revision Notes */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 mb-2">
            Revision Reason or Focal Points (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Re-watch the section explaining async generator locks before interviews..."
            rows={3}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/[0.08]">
          {isMarked ? (
            <button
              type="button"
              onClick={handleRemoveRevision}
              className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-mono font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Queue</span>
            </button>
          ) : (
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">Not flagged yet</span>
          )}

          <button
            type="button"
            onClick={() => handleSaveRevision()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isMarked ? 'Update Revision' : 'Add to Revision Queue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

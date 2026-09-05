import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Clock, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  BookOpen
} from 'lucide-react';
import { Video, Note } from '../../types';
import { notesApi } from '../../services/api';
import { formatSeconds } from '../../utils/format';

interface NotesPanelProps {
  video: Video;
  currentPlaybackTime: number;
  onSeek: (seconds: number) => void;
  onNotesCountChanged?: () => void;
  externalAddTrigger?: { timestamp: number; key: number } | null;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  video,
  currentPlaybackTime,
  onSeek,
  onNotesCountChanged,
  externalAddTrigger,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Form states
  const [timestamp, setTimestamp] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Edit states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const allNotes = await notesApi.getAll(video.playlist_id);
      const videoNotes = allNotes.filter((n) => n.video_id === video.id);
      setNotes(videoNotes);
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [video.id]);

  // When external trigger arrives (e.g. from clicking Note button in player toolbar)
  useEffect(() => {
    if (externalAddTrigger) {
      setTimestamp(externalAddTrigger.timestamp);
      setTitle('');
      setContent('');
      setIsAdding(true);
      setEditingNoteId(null);
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
    setContent('');
    setIsAdding(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const created = await notesApi.create({
        video_id: video.id,
        timestamp: timestamp,
        timestamp_formatted: formatSeconds(timestamp),
        title: title.trim() || undefined,
        content: content.trim(),
      });
      setNotes((prev) => [...prev, created].sort((a, b) => a.timestamp - b.timestamp));
      setIsAdding(false);
      setTitle('');
      setContent('');
      if (onNotesCountChanged) onNotesCountChanged();
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title || '');
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: number) => {
    if (!editContent.trim()) return;

    try {
      const updated = await notesApi.update(noteId, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingNoteId(null);
    } catch (err) {
      console.error('Failed to update note', err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await notesApi.delete(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (onNotesCountChanged) onNotesCountChanged();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between font-mono pb-2 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-600 dark:text-[#00e5ff]" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Video Notes</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-[#00e5ff]/15 text-cyan-900 dark:text-[#00e5ff] border border-cyan-300 dark:border-[#00e5ff]/30">
            {notes.length}
          </span>
        </div>

        {!isAdding && (
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note @ {formatSeconds(currentPlaybackTime)}</span>
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <form onSubmit={handleSaveNote} className="p-4 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-cyan-400 dark:border-cyan-500/40 space-y-3 animate-slide-up shadow-lg font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08] text-xs text-cyan-800 dark:text-[#00e5ff] font-bold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>NOTE AT TIMESTAMP: {formatSeconds(timestamp)}</span>
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
            placeholder="Note Title (optional, e.g. 'Key Rule on Decorators')"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here... (Markdown supported)"
            rows={3}
            required
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
            autoFocus
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
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] rounded-xl shadow-md transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/[0.08] p-6 space-y-2 bg-slate-50/50 dark:bg-transparent">
            <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">No notes for this video yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Click the "Note @ 00:00" button under the video or "+ Add Note" to capture insights with frame timestamps.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1426] border-2 border-slate-300 dark:border-white/[0.08] hover:border-cyan-500/50 space-y-2.5 transition-all shadow-sm"
            >
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white resize-none font-sans"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="px-3 py-1 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] text-black dark:hover:bg-[#38e1ff] rounded-lg shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    {/* Clickable timestamp chip that seeks player */}
                    <button
                      onClick={() => onSeek(note.timestamp)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-[#00e5ff]/10 text-cyan-900 dark:text-[#00e5ff] hover:bg-cyan-200 dark:hover:bg-[#00e5ff]/20 border border-cyan-300 dark:border-[#00e5ff]/30 text-xs font-mono font-bold transition-colors"
                      title="Jump to video timestamp"
                    >
                      <Clock className="w-3 h-3 text-cyan-700 dark:text-[#00e5ff]" />
                      <span>{note.timestamp_formatted || formatSeconds(note.timestamp)}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 rounded text-slate-500 hover:text-cyan-700 dark:hover:text-[#00e5ff] hover:bg-slate-200/60 dark:hover:bg-white/[0.05]"
                        title="Edit note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {note.title && (
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {note.title}
                    </h5>
                  )}

                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {note.content}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Edit3, 
  Trash2, 
  ExternalLink
} from 'lucide-react';
import { Note, PlaylistSummary } from '../types';
import { notesApi, playlistsApi } from '../services/api';
import { formatRelativeDate, formatSeconds } from '../utils/format';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const data = await notesApi.getAll(selectedPlaylistId || undefined);
      setNotes(data);
    } catch (err) {
      console.error('Failed to load notebook notes', err);
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
    fetchNotes();
  }, [selectedPlaylistId]);

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

  const handleDelete = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesApi.delete(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.video_title || '').toLowerCase().includes(q) ||
      (n.playlist_title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00e5ff] border border-cyan-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
              Curriculum Notebook
            </h1>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono mt-0.5">
              All your frame-accurate timestamp notes across active courses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-800 dark:text-[#00e5ff] bg-cyan-100 dark:bg-[#00e5ff]/15 px-3.5 py-1.5 rounded-xl border border-cyan-300 dark:border-[#00e5ff]/30">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'Note' : 'Notes'}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by keyword, video, or course..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c1426] border border-slate-300 dark:border-white/[0.12] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
          />
        </div>

        {/* Playlist Filter */}
        <select
          value={selectedPlaylistId || ''}
          onChange={(e) => setSelectedPlaylistId(e.target.value ? Number(e.target.value) : null)}
          className="px-3.5 py-2.5 bg-white dark:bg-[#0c1426] border border-slate-300 dark:border-white/[0.12] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-semibold shadow-sm"
        >
          <option value="">All Courses ({playlists.length})</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">Loading notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-white/60 dark:bg-[#0c1426]/50 p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notes found</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium">
            {searchQuery ? 'Try changing your search terms.' : 'Capture timestamped notes while watching any video in your courses.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0c1426] border-2 border-slate-200 dark:border-white/[0.08] hover:border-cyan-500/50 dark:hover:border-cyan-500/40 transition-all shadow-sm dark:shadow-md flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  {/* Timestamp & Course tag */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/playlist/${note.playlist_id}?videoId=${note.video_id}&t=${note.timestamp}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-[#00e5ff]/15 hover:bg-cyan-200 dark:hover:bg-[#00e5ff]/25 text-cyan-900 dark:text-[#00e5ff] text-xs font-mono font-bold border border-cyan-300 dark:border-[#00e5ff]/30 transition-colors"
                      title="Jump to video timestamp"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{note.timestamp_formatted || formatSeconds(note.timestamp)}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100" />
                    </Link>

                    {note.playlist_title && (
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {note.playlist_title}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(note)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
                      title="Edit note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Video Title */}
                {note.video_title && (
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {note.video_title}
                  </p>
                )}

                {/* Note Content / Editing */}
                {editingNoteId === note.id ? (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title (optional)"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/15 rounded-lg text-xs text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/15 rounded-lg text-xs text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-3 py-1 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 dark:bg-[#00e5ff] dark:hover:bg-[#38e1ff] text-black rounded-lg shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {note.title && (
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white mb-1">
                        {note.title}
                      </h4>
                    )}
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {note.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                <span>Created {formatRelativeDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

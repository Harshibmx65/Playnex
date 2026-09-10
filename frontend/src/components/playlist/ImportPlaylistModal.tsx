import React, { useState } from 'react';
import { X, Youtube, Loader2, Link2, Sparkles, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { playlistsApi } from '../../services/api';
import { extractErrorMessage } from '../../utils/format';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (playlistId: number) => void;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePlaylists = [
    {
      title: 'Next.js 15 Crash Course',
      url: 'https://www.youtube.com/playlist?list=PLillGF-RfqbZ2ybcoD2OamnhGq3zsQnhP'
    },
    {
      title: 'React TypeScript Full Course',
      url: 'https://www.youtube.com/playlist?list=PLC3y8-rFHvwhiQJD1di4eRVN30WWCXkg1'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please paste a YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const playlist = await playlistsApi.importPlaylist(url.trim());
      onSuccess(playlist.id);
    } catch (err: any) {
      console.error(err);
      setError(extractErrorMessage(err, 'Failed to import playlist. Please verify the URL.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00e5ff]">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import YouTube Playlist</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Extract curriculum, durations & launch in distraction-free player
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2">
              YouTube Playlist URL or ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#070b14] border-2 border-slate-300 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
              Supports standard playlists, watch URLs with list ID, or raw IDs.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Examples */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 mb-2 font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00e5ff]" />
              <span>Try a demo playlist:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePlaylists.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setUrl(sample.url)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-[#070b14] hover:bg-slate-200 dark:hover:bg-white/[0.05] text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-white/15 hover:border-cyan-500/50 transition-colors shadow-xs"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] hover:from-[#38e1ff] hover:to-[#00e5ff] disabled:opacity-50 rounded-xl shadow-md shadow-cyan-500/20 active:scale-95 transition-all font-mono"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportPlaylistModal;

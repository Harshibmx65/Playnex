import React, { useState, useEffect } from 'react';
import { 
  Tag as TagIcon, 
  Plus, 
  Check, 
  X, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { Video, Tag } from '../../types';
import { tagsApi } from '../../services/api';
import { getTagColorClasses } from '../../utils/format';

interface TagsManagerProps {
  video: Video;
  onTagsUpdated: (updatedTags: Tag[]) => void;
}

export const TagsManager: React.FC<TagsManagerProps> = ({
  video,
  onTagsUpdated,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('indigo');
  const [isLoading, setIsLoading] = useState(false);

  const colors = [
    { name: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { name: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { name: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { name: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { name: 'sky', label: 'Sky', bg: 'bg-sky-500' },
    { name: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  ];

  const fetchTags = async () => {
    try {
      const data = await tagsApi.getAll();
      setAllTags(data);
    } catch (err) {
      console.error('Failed to load user tags', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const assignedTagIds = new Set(video.tags.map((t) => t.id));

  const handleToggleTag = async (tagId: number) => {
    let updatedIds: number[] = [];
    if (assignedTagIds.has(tagId)) {
      updatedIds = video.tags.filter((t) => t.id !== tagId).map((t) => t.id);
    } else {
      updatedIds = [...video.tags.map((t) => t.id), tagId];
    }

    try {
      const updatedVideoTags = await tagsApi.assignToVideo(video.id, updatedIds);
      onTagsUpdated(updatedVideoTags);
    } catch (err) {
      console.error('Failed to assign tag', err);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsLoading(true);
    try {
      const created = await tagsApi.create({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setAllTags((prev) => [...prev, created]);
      // Auto-assign to current video
      await handleToggleTag(created.id);
      setNewTagName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create tag', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Video Tags</h3>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tag</span>
          </button>
        )}
      </div>

      {/* Create New Tag Form */}
      {isCreating && (
        <form onSubmit={handleCreateTag} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c1426] border border-slate-200 dark:border-white/[0.08] space-y-3 animate-slide-up shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
            <span className="font-bold">CREATE TAXONOMY TAG</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name (e.g. 'DSA', 'Interview', 'Tricky')"
            required
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#070b14] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            autoFocus
          />

          {/* Color Chooser */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setNewTagColor(c.name)}
                  className={`w-5 h-5 rounded-full ${c.bg} transition-transform ${
                    newTagColor === c.name ? 'ring-2 ring-purple-400 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1 text-xs font-mono font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm"
            >
              Create & Assign
            </button>
          </div>
        </form>
      )}

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {allTags.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] p-6 space-y-2">
            <TagIcon className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No custom tags created</p>
            <p className="text-[11px] text-slate-500">
              Create tags to categorize and filter lessons across all your courses.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isAssigned = assignedTagIds.has(tag.id);
              const colorClasses = getTagColorClasses(tag.color);

              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                    isAssigned
                      ? `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} shadow-sm scale-105`
                      : 'bg-white dark:bg-[#0c1426] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{tag.name}</span>
                  {isAssigned && <Check className="w-3 h-3 ml-0.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

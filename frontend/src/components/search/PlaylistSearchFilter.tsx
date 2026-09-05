import React from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock3, 
  Circle, 
  HelpCircle, 
  RotateCw, 
  ArrowUpDown, 
  Tag as TagIcon,
  X
} from 'lucide-react';
import { Tag } from '../../types';
import { getTagColorClasses } from '../../utils/format';

interface PlaylistSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  selectedTagIds: number[];
  onToggleTagFilter: (tagId: number) => void;
  availableTags: Tag[];
  counts: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    doubts: number;
    revisions: number;
  };
}

export const PlaylistSearchFilter: React.FC<PlaylistSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange,
  selectedTagIds,
  onToggleTagFilter,
  availableTags,
  counts,
}) => {
  const filterTabs = [
    { id: 'ALL', label: 'All', count: counts.total },
    { id: 'COMPLETED', label: 'Completed', count: counts.completed, icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', count: counts.inProgress, icon: Clock3, color: 'text-amber-500 dark:text-amber-400' },
    { id: 'NOT_STARTED', label: 'Not Started', count: counts.notStarted, icon: Circle, color: 'text-slate-400' },
    { id: 'HAS_DOUBT', label: 'Has Doubt', count: counts.doubts, icon: HelpCircle, color: 'text-rose-500 dark:text-rose-400' },
    { id: 'NEEDS_REVISION', label: 'Revise', count: counts.revisions, icon: RotateCw, color: 'text-amber-500 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* Search Bar + Sort Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search videos, concepts, notes, doubts, or tags..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="relative shrink-0">
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2.5 bg-white dark:bg-[#0c1426] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm font-mono"
          >
            <option value="POSITION">Playlist Order</option>
            <option value="RECENT">Recently Watched</option>
            <option value="STATUS">Completion Status</option>
            <option value="DURATION">Duration (Longest)</option>
          </select>
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border ${
                isSelected
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-400 shadow-sm font-semibold'
                  : 'bg-white dark:bg-[#0c1426]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${tab.color || ''}`} />}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-cyan-200 dark:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tag Filters Matrix (if available) */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <TagIcon className="w-3 h-3" />
            <span>Tags:</span>
          </span>
          {availableTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            const style = getTagColorClasses(tag.color);
            return (
              <button
                key={tag.id}
                onClick={() => onToggleTagFilter(tag.id)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-1 ring-white/20 font-bold shadow-sm`
                    : 'bg-white dark:bg-[#0c1426]/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
          {selectedTagIds.length > 0 && (
            <button
              onClick={() => {
                availableTags.forEach((t) => {
                  if (selectedTagIds.includes(t.id)) onToggleTagFilter(t.id);
                });
              }}
              className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline ml-1"
            >
              Clear tags
            </button>
          )}
        </div>
      )}
    </div>
  );
};

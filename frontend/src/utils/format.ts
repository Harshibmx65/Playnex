export function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseFormattedTime(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formats total seconds into a clean human-readable duration (e.g. "2h 15m", "45m", "3h")
 */
export function formatTotalHours(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0h';
  const hrs = seconds / 3600;
  if (hrs < 1) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${mins}m`;
  }
  const hours = Math.floor(hrs);
  const remainingMins = Math.round((seconds % 3600) / 60);
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Formats total seconds into decimal hours (e.g. "2.5 hrs", "0.8 hrs")
 */
export function formatDecimalHours(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 hrs';
  const hrs = seconds / 3600;
  if (hrs < 0.1) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${mins} mins`;
  }
  return `${hrs.toFixed(1)} hrs`;
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getTagColorClasses(colorName: string = 'indigo'): { bg: string; text: string; border: string } {
  switch (colorName.toLowerCase()) {
    case 'rose':
    case 'red':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'amber':
    case 'yellow':
    case 'orange':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'emerald':
    case 'green':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'sky':
    case 'blue':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'purple':
    case 'violet':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'fuchsia':
    case 'pink':
      return { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' };
    case 'indigo':
    default:
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' };
  }
}

export function getPriorityBadge(priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): { bg: string; text: string; label: string } {
  switch (priority) {
    case 'HIGH':
      return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', text: 'text-rose-400', label: 'High Priority' };
    case 'MEDIUM':
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'text-amber-400', label: 'Medium Priority' };
    case 'LOW':
    default:
      return { bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40', text: 'text-sky-400', label: 'Low Priority' };
  }
}

/**
 * Robust error extractor ensuring no raw error objects/arrays crash React rendering
 */
export function extractErrorMessage(err: any, fallback: string = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

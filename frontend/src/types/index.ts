export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_verified?: boolean;
  is_guest?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}



export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  video_id: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  watch_percentage: number;
  last_position: number;
  completed_at?: string | null;
  updated_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  video_id: number;
  timestamp: number;
  timestamp_formatted: string;
  title?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  video_title?: string;
  playlist_id?: number;
  playlist_title?: string;
}

export interface Doubt {
  id: number;
  user_id: number;
  video_id: number;
  timestamp: number;
  timestamp_formatted: string;
  title: string;
  description?: string | null;
  status: 'OPEN' | 'RESOLVED';
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  video_title?: string;
  youtube_video_id?: string;
  playlist_id?: number;
  playlist_title?: string;
}

export interface Revision {
  id: number;
  user_id: number;
  video_id: number;
  status: 'NEED_REVISION' | 'REVISING' | 'REVISED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string | null;
  last_revised_at?: string | null;
  created_at: string;
  updated_at: string;
  video_title?: string;
  youtube_video_id?: string;
  duration?: string;
  playlist_id?: number;
  playlist_title?: string;
  video_position?: number;
}

export interface VideoChapter {
  timestamp: number;
  timestamp_formatted: string;
  title: string;
}

export interface Video {
  id: number;
  playlist_id: number;
  youtube_video_id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  duration_seconds: number;
  position: number;
  description?: string;
  created_at: string;
  progress?: Progress;
  tags: Tag[];
  notes_count: number;
  doubts_count: number;
  open_doubts_count: number;
  revision?: Revision | null;
  chapters?: VideoChapter[];
}

export interface VideoDetail extends Video {
  notes: Note[];
  doubts: Doubt[];
  chapters?: VideoChapter[];
}

export interface PlaylistSummary {
  id: number;
  user_id: number;
  youtube_playlist_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channel_name?: string;
  video_count: number;
  created_at: string;
  updated_at: string;
  total_videos: number;
  completed_videos: number;
  in_progress_videos: number;
  not_started_videos: number;
  progress_percentage: number;
  total_duration_seconds: number;
  total_duration_formatted?: string;
  completed_duration_seconds?: number;
  completed_duration_formatted?: string;
  last_watched_video?: string | null;
  last_watched_video_id?: number | null;
  last_activity: string;
  doubts_count: number;
  open_doubts_count: number;
  revisions_count: number;
  notes_count: number;
  tags_count: number;
}

export interface PlaylistDetail extends PlaylistSummary {
  videos: Video[];
}

export interface RecentActivity {
  video_id: number;
  video_title: string;
  youtube_video_id: string;
  playlist_id: number;
  playlist_title: string;
  last_position: number;
  watch_percentage: number;
  status: string;
  updated_at: string;
}

export interface GlobalDashboardStats {
  total_playlists: number;
  total_videos: number;
  completed_videos: number;
  in_progress_videos: number;
  not_started_videos: number;
  overall_completion_percentage: number;
  total_duration_seconds?: number;
  total_duration_formatted?: string;
  completed_duration_seconds?: number;
  completed_duration_formatted?: string;
  open_doubts_count: number;
  need_revision_count: number;
  total_notes_count: number;
  continue_learning?: RecentActivity | null;
  recent_playlists: PlaylistSummary[];
  revision_queue: Revision[];
  unresolved_doubts: Doubt[];
}

export type DashboardStats = GlobalDashboardStats;
export type RevisionQueueItem = Revision;


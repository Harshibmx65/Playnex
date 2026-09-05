import axios from 'axios';
import {
  AuthResponse,
  User,
  OtpResponse,
  PlaylistSummary,
  PlaylistDetail,
  VideoDetail,
  Progress,
  Note,
  Doubt,
  Tag,
  Revision,
  GlobalDashboardStats
} from '../types';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking me
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  sendRegisterOtp: async (name: string, email: string, password: string): Promise<OtpResponse> => {
    const res = await api.post<OtpResponse>('/auth/register/send-otp', { name, email, password });
    return res.data;
  },
  verifyRegisterOtp: async (email: string, otpCode: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register/verify-otp', { email, otp_code: otpCode });
    return res.data;
  },
  resendRegisterOtp: async (email: string): Promise<OtpResponse> => {
    const res = await api.post<OtpResponse>('/auth/register/resend-otp', { email });
    return res.data;
  },
  guestLogin: async (): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/guest-login');
    return res.data;
  },
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};


// Playlists API
export const playlistsApi = {
  getAll: async (): Promise<PlaylistSummary[]> => {
    const res = await api.get<PlaylistSummary[]>('/playlists');
    return res.data;
  },
  getById: async (id: number): Promise<PlaylistDetail> => {
    const res = await api.get<PlaylistDetail>(`/playlists/${id}`);
    return res.data;
  },
  importPlaylist: async (url: string): Promise<PlaylistDetail> => {
    const res = await api.post<PlaylistDetail>('/playlists/import', { url });
    return res.data;
  },
  update: async (id: number, data: { title?: string; description?: string }): Promise<PlaylistSummary> => {
    const res = await api.patch<PlaylistSummary>(`/playlists/${id}`, data);
    return res.data;
  },
  sync: async (id: number): Promise<PlaylistDetail> => {
    const res = await api.post<PlaylistDetail>(`/playlists/${id}/sync`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/playlists/${id}`);
  },
};

// Videos API
export const videosApi = {
  getDetail: async (videoId: number): Promise<VideoDetail> => {
    const res = await api.get<VideoDetail>(`/videos/${videoId}`);
    return res.data;
  },
};

// Progress API
export const progressApi = {
  update: async (data: {
    video_id: number;
    watch_percentage?: number;
    last_position?: number;
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  }): Promise<Progress> => {
    const res = await api.post<Progress>('/progress/update', data);
    return res.data;
  },
  toggleComplete: async (videoId: number): Promise<Progress> => {
    const res = await api.post<Progress>(`/progress/toggle-complete/${videoId}`);
    return res.data;
  },
};

// Notes API
export const notesApi = {
  getAll: async (playlistId?: number): Promise<Note[]> => {
    const params = playlistId ? { playlist_id: playlistId } : {};
    const res = await api.get<Note[]>('/notes', { params });
    return res.data;
  },
  create: async (data: {
    video_id: number;
    timestamp: number;
    timestamp_formatted?: string;
    title?: string;
    content: string;
  }): Promise<Note> => {
    const res = await api.post<Note>('/notes', data);
    return res.data;
  },
  update: async (
    id: number,
    data: {
      timestamp?: number;
      timestamp_formatted?: string;
      title?: string;
      content?: string;
    }
  ): Promise<Note> => {
    const res = await api.patch<Note>(`/notes/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },
};

// Doubts API
export const doubtsApi = {
  getAll: async (params?: { status_filter?: string; playlist_id?: number }): Promise<Doubt[]> => {
    const res = await api.get<Doubt[]>('/doubts', { params });
    return res.data;
  },
  create: async (data: {
    video_id: number;
    timestamp: number;
    timestamp_formatted?: string;
    title: string;
    description?: string;
  }): Promise<Doubt> => {
    const res = await api.post<Doubt>('/doubts', data);
    return res.data;
  },
  update: async (
    id: number,
    data: {
      timestamp?: number;
      timestamp_formatted?: string;
      title?: string;
      description?: string;
      status?: 'OPEN' | 'RESOLVED';
      resolution_notes?: string;
    }
  ): Promise<Doubt> => {
    const res = await api.patch<Doubt>(`/doubts/${id}`, data);
    return res.data;
  },
  toggleResolve: async (id: number): Promise<Doubt> => {
    const res = await api.post<Doubt>(`/doubts/${id}/toggle-resolve`);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/doubts/${id}`);
  },
};

// Tags API
export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const res = await api.get<Tag[]>('/tags');
    return res.data;
  },
  create: async (data: { name: string; color?: string }): Promise<Tag> => {
    const res = await api.post<Tag>('/tags', data);
    return res.data;
  },
  assignToVideo: async (videoId: number, tagIds: number[]): Promise<Tag[]> => {
    const res = await api.post<Tag[]>(`/tags/video/${videoId}/assign`, { tag_ids: tagIds });
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
};

// Revisions API
export const revisionsApi = {
  getQueue: async (params?: { playlist_id?: number; status_filter?: string }): Promise<Revision[]> => {
    const res = await api.get<Revision[]>('/revisions/queue', { params });
    return res.data;
  },
  createOrUpdate: async (data: {
    video_id: number;
    status?: 'NEED_REVISION' | 'REVISING' | 'REVISED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    notes?: string;
  }): Promise<Revision> => {
    const res = await api.post<Revision>('/revisions', data);
    return res.data;
  },
  markRevised: async (videoId: number): Promise<Revision> => {
    const res = await api.post<Revision>(`/revisions/mark-revised/${videoId}`);
    return res.data;
  },
  removeFromRevision: async (videoId: number): Promise<void> => {
    await api.delete(`/revisions/video/${videoId}`);
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async (): Promise<GlobalDashboardStats> => {
    const res = await api.get<GlobalDashboardStats>('/analytics/dashboard');
    return res.data;
  },
};

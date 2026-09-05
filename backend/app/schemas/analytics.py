from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.playlist import PlaylistSummaryOut
from app.schemas.revision import RevisionWithVideoOut
from app.schemas.doubt import DoubtWithVideoOut

class RecentActivity(BaseModel):
    video_id: int
    video_title: str
    youtube_video_id: str
    playlist_id: int
    playlist_title: str
    last_position: float
    watch_percentage: float
    status: str
    updated_at: datetime

class GlobalDashboardStats(BaseModel):
    total_playlists: int
    total_videos: int
    completed_videos: int
    in_progress_videos: int
    not_started_videos: int
    overall_completion_percentage: float
    total_duration_seconds: int = 0
    total_duration_formatted: str = "0h"
    completed_duration_seconds: int = 0
    completed_duration_formatted: str = "0h"
    open_doubts_count: int
    need_revision_count: int
    total_notes_count: int
    continue_learning: Optional[RecentActivity] = None
    recent_playlists: List[PlaylistSummaryOut] = []
    revision_queue: List[RevisionWithVideoOut] = []
    unresolved_doubts: List[DoubtWithVideoOut] = []

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.video import VideoOut

class PlaylistImport(BaseModel):
    url: str

class PlaylistCreate(BaseModel):
    youtube_playlist_id: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    channel_name: Optional[str] = None

class PlaylistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class PlaylistSummaryOut(BaseModel):
    id: int
    user_id: int
    youtube_playlist_id: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    channel_name: Optional[str] = None
    video_count: int
    created_at: datetime
    updated_at: datetime
    
    # Progress & Dashboard Stats
    total_videos: int = 0
    completed_videos: int = 0
    in_progress_videos: int = 0
    not_started_videos: int = 0
    progress_percentage: float = 0.0
    total_duration_seconds: int = 0
    total_duration_formatted: str = "0h"
    completed_duration_seconds: int = 0
    completed_duration_formatted: str = "0h"
    last_watched_video: Optional[str] = None
    last_watched_video_id: Optional[int] = None
    last_activity: Optional[datetime] = None
    doubts_count: int = 0
    open_doubts_count: int = 0
    revisions_count: int = 0
    notes_count: int = 0
    tags_count: int = 0

    class Config:
        from_attributes = True

class PlaylistDetailOut(PlaylistSummaryOut):
    videos: List[VideoOut] = []

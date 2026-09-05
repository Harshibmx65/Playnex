from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.tag import TagOut
from app.schemas.note import NoteOut
from app.schemas.doubt import DoubtOut
from app.schemas.revision import RevisionOut
from app.schemas.progress import ProgressOut

class VideoBase(BaseModel):
    youtube_video_id: str
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = "00:00"
    duration_seconds: Optional[int] = 0
    position: int = 0
    description: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class VideoOut(VideoBase):
    id: int
    playlist_id: int
    created_at: datetime
    progress: Optional[ProgressOut] = None
    tags: List[TagOut] = []
    notes_count: int = 0
    doubts_count: int = 0
    open_doubts_count: int = 0
    revision: Optional[RevisionOut] = None

    class Config:
        from_attributes = True

class VideoDetailOut(VideoOut):
    notes: List[NoteOut] = []
    doubts: List[DoubtOut] = []

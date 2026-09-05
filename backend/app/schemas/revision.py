from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RevisionBase(BaseModel):
    status: str = "NEED_REVISION"  # NEED_REVISION, REVISING, REVISED
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    notes: Optional[str] = None

class RevisionCreate(RevisionBase):
    video_id: int

class RevisionUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class RevisionOut(RevisionBase):
    id: int
    user_id: int
    video_id: int
    last_revised_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RevisionWithVideoOut(RevisionOut):
    video_title: Optional[str] = None
    youtube_video_id: Optional[str] = None
    duration: Optional[str] = None
    playlist_id: Optional[int] = None
    playlist_title: Optional[str] = None
    video_position: Optional[int] = None

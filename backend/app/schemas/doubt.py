from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DoubtBase(BaseModel):
    timestamp: float = 0.0
    timestamp_formatted: str = "00:00"
    title: str
    description: Optional[str] = None

class DoubtCreate(DoubtBase):
    video_id: int

class DoubtUpdate(BaseModel):
    timestamp: Optional[float] = None
    timestamp_formatted: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # OPEN, RESOLVED
    resolution_notes: Optional[str] = None

class DoubtOut(DoubtBase):
    id: int
    user_id: int
    video_id: int
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DoubtWithVideoOut(DoubtOut):
    video_title: Optional[str] = None
    youtube_video_id: Optional[str] = None
    playlist_id: Optional[int] = None
    playlist_title: Optional[str] = None

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteBase(BaseModel):
    timestamp: float = 0.0
    timestamp_formatted: str = "00:00"
    title: Optional[str] = None
    content: str

class NoteCreate(NoteBase):
    video_id: int

class NoteUpdate(BaseModel):
    timestamp: Optional[float] = None
    timestamp_formatted: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None

class NoteOut(NoteBase):
    id: int
    user_id: int
    video_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteWithVideoOut(NoteOut):
    video_title: Optional[str] = None
    playlist_id: Optional[int] = None
    playlist_title: Optional[str] = None

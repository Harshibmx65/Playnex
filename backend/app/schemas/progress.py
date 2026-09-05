from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgressUpdate(BaseModel):
    video_id: int
    watch_percentage: Optional[float] = None
    last_position: Optional[float] = None
    status: Optional[str] = None  # NOT_STARTED, IN_PROGRESS, COMPLETED

class ProgressOut(BaseModel):
    id: int
    user_id: int
    video_id: int
    status: str
    watch_percentage: float
    last_position: float
    completed_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

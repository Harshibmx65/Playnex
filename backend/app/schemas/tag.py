from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str
    color: Optional[str] = "indigo"

class TagCreate(TagBase):
    pass

class TagOut(TagBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class VideoTagAssign(BaseModel):
    tag_ids: list[int]

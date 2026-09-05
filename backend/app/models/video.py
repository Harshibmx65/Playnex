from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False, index=True)
    youtube_video_id = Column(String(255), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    thumbnail = Column(String(1000), nullable=True)
    duration = Column(String(50), default="00:00")
    duration_seconds = Column(Integer, default=0)
    position = Column(Integer, default=0, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    playlist = relationship("Playlist", back_populates="videos")
    progress = relationship("UserVideoProgress", back_populates="video", cascade="all, delete-orphan")
    video_tags = relationship("VideoTag", back_populates="video", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="video", cascade="all, delete-orphan")
    doubts = relationship("Doubt", back_populates="video", cascade="all, delete-orphan")
    revisions = relationship("Revision", back_populates="video", cascade="all, delete-orphan")

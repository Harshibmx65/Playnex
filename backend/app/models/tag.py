from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    color = Column(String(50), default="indigo")  # indigo, emerald, amber, rose, sky, purple, fuchsia, slate
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_tag_name"),
    )

    # Relationships
    user = relationship("User", back_populates="tags")
    video_tags = relationship("VideoTag", back_populates="tag", cascade="all, delete-orphan")

class VideoTag(Base):
    __tablename__ = "video_tags"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("video_id", "tag_id", name="uq_video_tag"),
    )

    # Relationships
    video = relationship("Video", back_populates="video_tags")
    tag = relationship("Tag", back_populates="video_tags")

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class UserVideoProgress(Base):
    __tablename__ = "user_video_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="NOT_STARTED", index=True)  # NOT_STARTED, IN_PROGRESS, COMPLETED
    watch_percentage = Column(Float, default=0.0)
    last_position = Column(Float, default=0.0)  # seconds
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uq_user_video_progress"),
    )

    # Relationships
    user = relationship("User", back_populates="progress_records")
    video = relationship("Video", back_populates="progress")

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Revision(Base):
    __tablename__ = "revisions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="NEED_REVISION", index=True)  # NEED_REVISION, REVISING, REVISED
    priority = Column(String(50), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH
    notes = Column(Text, nullable=True)
    last_revised_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uq_user_video_revision"),
    )

    # Relationships
    user = relationship("User", back_populates="revisions")
    video = relationship("Video", back_populates="revisions")

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True)  # True once OTP verified
    is_guest = Column(Boolean, default=False)     # True for temporary guest accounts
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


    # Relationships
    playlists = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
    progress_records = relationship("UserVideoProgress", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    doubts = relationship("Doubt", back_populates="user", cascade="all, delete-orphan")
    revisions = relationship("Revision", back_populates="user", cascade="all, delete-orphan")

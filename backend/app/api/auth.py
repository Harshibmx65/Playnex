import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import User
from app.models.tag import Tag, VideoTag
from app.models.playlist import Playlist
from app.models.video import Video
from app.models.progress import UserVideoProgress
from app.models.note import Note
from app.models.doubt import Doubt
from app.models.revision import Revision
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserOut
)

router = APIRouter(prefix="/auth", tags=["auth"])

def seed_user_initial_data(db: Session, user: User, is_guest: bool = False):
    """Seed standard tags and starter demo playlist for newly registered users and guests"""
    # Standard tags
    tags_data = [
        ("Important", "rose"),
        ("Revise", "amber"),
        ("Interview", "purple"),
        ("Difficult", "rose"),
        ("DSA", "sky"),
        ("Backend", "emerald"),
    ]
    created_tags = {}
    for name, color in tags_data:
        t = Tag(user_id=user.id, name=name, color=color)
        db.add(t)
        db.flush()
        created_tags[name] = t

    # Starter Interactive Playlist (FastAPI & Modern Web)
    starter_pl = Playlist(
        user_id=user.id,
        youtube_playlist_id="PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH",
        title="Python FastAPI & Modern Backend Architecture",
        description="Master modern async Python backends, Pydantic validation, dependency injection, and production deployments.",
        thumbnail="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
        channel_name="Tiangolo & Tech Tutorials",
        video_count=4,
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(starter_pl)
    db.flush()

    starter_videos = [
        ("Introduction to FastAPI & Async Python", "0sOvCWFmrtA", "14:20", 860, "Getting started with FastAPI, setup, and why async IO provides incredible throughput.\n\nTimestamps:\n00:00 - Introduction & Course Overview\n01:30 - What is FastAPI & Why Async IO?\n04:15 - Virtual Environment & Uvicorn Setup\n08:20 - Declaring First @app.get('/') Root Route\n11:45 - Automatic Interactive Swagger & Redoc\n13:10 - Summary & Next Steps"),
        ("Path Parameters & Query Validation", "SORiTsvnU28", "22:45", 1365, "Declaring clean path parameters, query parameters, types, and string constraints.\n\nChapters:\n00:00 - Introduction to Path Parameters\n02:40 - Adding Type Hints & Automatic Conversion\n06:15 - Query Parameters & Default Values\n12:30 - String Validation with Query(min_length, max_length)\n18:45 - Summary & Parameter Best Practices"),
        ("Pydantic v2 Models & Data Parsing", "GN6ICac3OXY", "31:10", 1870, "Deep dive into Pydantic models, custom validators, nested schemas, and computed fields."),
        ("Authentication with OAuth2 & JWT Tokens", "3vUPJA3l12M", "42:15", 2535, "Implementing secure JWT access tokens, password hashing with bcrypt, and protected endpoints.\n\nTimestamps:\n00:00 - Auth Architecture & Security Principles\n05:10 - Password Hashing with Passlib & Bcrypt\n14:30 - Generating JWT Tokens with Expiration\n26:00 - Creating get_current_user Dependency\n38:45 - Testing Protected Endpoints in Swagger")
    ]

    v_objs = []
    for idx, (v_title, y_id, dur_str, dur_secs, desc) in enumerate(starter_videos):
        v = Video(
            playlist_id=starter_pl.id,
            youtube_video_id=y_id,
            title=v_title,
            thumbnail="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
            duration=dur_str,
            duration_seconds=dur_secs,
            position=idx + 1,
            description=desc
        )
        db.add(v)
        db.flush()
        v_objs.append(v)

    # Initial progress on video 1
    db.add(UserVideoProgress(
        user_id=user.id,
        video_id=v_objs[0].id,
        status="COMPLETED",
        watch_percentage=100.0,
        last_position=860.0,
        completed_at=datetime.now(timezone.utc) - timedelta(hours=4),
        updated_at=datetime.now(timezone.utc) - timedelta(hours=4)
    ))

    # Initial Note & Doubt on video 2
    db.add(Note(
        user_id=user.id,
        video_id=v_objs[1].id,
        timestamp=245,
        timestamp_formatted="04:05",
        title="Query Validation Trick",
        content="Use Query(..., min_length=3, max_length=50) for strict input validation in FastAPI."
    ))

    db.add(Doubt(
        user_id=user.id,
        video_id=v_objs[1].id,
        timestamp=480,
        timestamp_formatted="08:00",
        title="How does Path parameter regex work with sub-paths?",
        description="Need to clarify how Starlette regex routes handle forward slashes in path variables.",
        status="OPEN"
    ))

    # Revision Queue
    db.add(Revision(
        user_id=user.id,
        video_id=v_objs[0].id,
        status="NEED_REVISION",
        priority="HIGH",
        notes="Revise the async loop vs threadpool concurrency behavior before interviews."
    ))


@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user with strong password validation.
    Password must have length >= 8, min 1 uppercase, min 1 lowercase, min 1 special character.
    """
    email_clean = str(user_in.email).strip().lower()
    name_clean = user_in.name.strip()

    # Check if a non-guest registered user already exists with this email
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user and not existing_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # Hash password securely with bcrypt
    hashed_pwd = get_password_hash(user_in.password)

    if existing_user and existing_user.is_guest:
        # Upgrade guest to a permanent registered account
        existing_user.name = name_clean
        existing_user.password_hash = hashed_pwd
        existing_user.is_verified = True
        existing_user.is_guest = False
        existing_user.avatar = existing_user.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={name_clean}"
        user = existing_user
    else:
        user = User(
            name=name_clean,
            email=email_clean,
            password_hash=hashed_pwd,
            avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={name_clean}",
            is_verified=True,
            is_guest=False
        )
        db.add(user)
        db.flush()
        # Seed initial tags & starter playlist
        seed_user_initial_data(db, user, is_guest=False)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user with email and password.
    Returns JWT access token upon successful credentials verification.
    """
    email_clean = str(user_in.email).strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/guest-login", response_model=Token)
def guest_login(db: Session = Depends(get_db)):
    """
    Creates an isolated temporary guest session with starter playlist and sandbox environment.
    """
    guest_uuid = uuid.uuid4().hex[:8]
    guest_email = f"guest_{guest_uuid}@guest.playnex.local"
    guest_name = f"Guest Learner #{guest_uuid[:4].upper()}"

    # Generate a cryptographically secure random password for guest account
    guest_user = User(
        name=guest_name,
        email=guest_email,
        password_hash=get_password_hash(f"GuestPass_{uuid.uuid4().hex[:12]}!"),
        avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={guest_uuid}",
        is_verified=True,
        is_guest=True
    )
    db.add(guest_user)
    db.flush()

    # Populate guest with sample interactive starter environment
    seed_user_initial_data(db, guest_user, is_guest=True)

    db.commit()
    db.refresh(guest_user)

    token = create_access_token(
        subject=guest_user.id,
        expires_delta=timedelta(days=1)  # 24-hour guest session
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": guest_user
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile information"""
    return current_user



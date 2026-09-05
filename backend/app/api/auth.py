import random
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import User
from app.models.otp import OtpVerification
from app.models.tag import Tag, VideoTag
from app.models.playlist import Playlist
from app.models.video import Video
from app.models.progress import UserVideoProgress
from app.models.note import Note
from app.models.doubt import Doubt
from app.models.revision import Revision
from app.services.email import send_verification_otp
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserOut,
    SendOtpRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    OtpResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])

def seed_user_initial_data(db: Session, user: User, is_guest: bool = False):
    """Seed standard tags and starter demo playlist for newly verified users and guests"""
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


@router.post("/register/send-otp", response_model=OtpResponse)
async def send_register_otp(user_in: SendOtpRequest, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()

    # Check if active verified user already exists
    existing_user = db.query(User).filter(
        User.email == email_clean,
        User.is_verified == True,
        User.is_guest == False
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # Cooldown check: Check if an OTP was sent to this email in the last 60 seconds
    now = datetime.now(timezone.utc)
    recent_otp = db.query(OtpVerification).filter(
        OtpVerification.email == email_clean,
        OtpVerification.is_used == False,
        OtpVerification.created_at > (now - timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS))
    ).first()

    if recent_otp:
        time_elapsed = int((now - recent_otp.created_at.replace(tzinfo=timezone.utc)).total_seconds())
        remaining = max(1, settings.OTP_RESEND_COOLDOWN_SECONDS - time_elapsed)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} seconds before requesting a new verification code."
        )

    # Invalidate previous unused OTPs for this email
    db.query(OtpVerification).filter(
        OtpVerification.email == email_clean,
        OtpVerification.is_used == False
    ).update({"is_used": True})
    db.commit()

    # Generate 6-digit numeric OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    password_hash = get_password_hash(user_in.password)

    new_otp = OtpVerification(
        email=email_clean,
        otp_code=otp_code,
        name=user_in.name.strip(),
        password_hash=password_hash,
        purpose="REGISTER",
        attempts=0,
        is_used=False,
        expires_at=expires_at,
        created_at=now
    )
    db.add(new_otp)
    db.commit()

    # Send OTP Email
    dispatch_result = await send_verification_otp(email_clean, user_in.name.strip(), otp_code)
    delivery_mode = dispatch_result.get("method")
    dev_otp = otp_code if delivery_mode in ("console_dev", "console_fallback") else None

    return {
        "message": f"Verification code sent to {email_clean}",
        "email": email_clean,
        "cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_seconds": settings.OTP_EXPIRE_MINUTES * 60,
        "delivery_mode": delivery_mode,
        "dev_otp": dev_otp
    }


@router.post("/register/resend-otp", response_model=OtpResponse)
async def resend_register_otp(req: ResendOtpRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()

    # Find the most recent registration OTP request for this email
    latest_otp = db.query(OtpVerification).filter(
        OtpVerification.email == email_clean,
        OtpVerification.purpose == "REGISTER"
    ).order_by(OtpVerification.created_at.desc()).first()

    if not latest_otp or not latest_otp.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email. Please sign up again."
        )

    # Check cooldown
    now = datetime.now(timezone.utc)
    created_at_utc = latest_otp.created_at.replace(tzinfo=timezone.utc) if latest_otp.created_at.tzinfo is None else latest_otp.created_at
    time_elapsed = int((now - created_at_utc).total_seconds())

    if time_elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
        remaining = settings.OTP_RESEND_COOLDOWN_SECONDS - time_elapsed
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} seconds before requesting a new code."
        )

    # Invalidate all prior codes
    db.query(OtpVerification).filter(
        OtpVerification.email == email_clean,
        OtpVerification.is_used == False
    ).update({"is_used": True})
    db.commit()

    # Generate new code keeping name and password_hash
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp = OtpVerification(
        email=email_clean,
        otp_code=otp_code,
        name=latest_otp.name,
        password_hash=latest_otp.password_hash,
        purpose="REGISTER",
        attempts=0,
        is_used=False,
        expires_at=expires_at,
        created_at=now
    )
    db.add(new_otp)
    db.commit()

    dispatch_result = await send_verification_otp(email_clean, latest_otp.name, otp_code)
    delivery_mode = dispatch_result.get("method")
    dev_otp = otp_code if delivery_mode in ("console_dev", "console_fallback") else None

    return {
        "message": f"A new verification code was sent to {email_clean}",
        "email": email_clean,
        "cooldown_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        "expires_in_seconds": settings.OTP_EXPIRE_MINUTES * 60,
        "delivery_mode": delivery_mode,
        "dev_otp": dev_otp
    }


@router.post("/register/verify-otp", response_model=Token)
def verify_register_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    entered_code = req.otp_code.strip()

    # Find active OTP record
    otp_record = db.query(OtpVerification).filter(
        OtpVerification.email == email_clean,
        OtpVerification.purpose == "REGISTER",
        OtpVerification.is_used == False
    ).order_by(OtpVerification.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email. Please request a new code."
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at_utc = otp_record.expires_at.replace(tzinfo=timezone.utc) if otp_record.expires_at.tzinfo is None else otp_record.expires_at

    if now > expires_at_utc:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please click 'Resend Code' to receive a new one."
        )

    # Brute-force protection: max 5 attempts
    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. For security, please request a new verification code."
        )

    # Verify code
    if otp_record.otp_code != entered_code:
        otp_record.attempts += 1
        remaining_attempts = 5 - otp_record.attempts
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining."
        )

    # Mark OTP as successfully used
    otp_record.is_used = True

    # Check if user record already exists (e.g., re-verifying or previous guest conversion)
    user = db.query(User).filter(User.email == email_clean).first()
    if user:
        user.name = otp_record.name or user.name
        user.password_hash = otp_record.password_hash or user.password_hash
        user.is_verified = True
        user.is_guest = False
        user.avatar = user.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.name}"
    else:
        user = User(
            name=otp_record.name,
            email=email_clean,
            password_hash=otp_record.password_hash,
            avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={otp_record.name}",
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


@router.post("/guest-login", response_model=Token)
def guest_login(db: Session = Depends(get_db)):
    """
    Creates an isolated temporary guest session.
    Guest can explore all playlist, note, doubt, and revision features.
    """
    guest_uuid = uuid.uuid4().hex[:8]
    guest_email = f"guest_{guest_uuid}@guest.playnex.local"
    guest_name = f"Guest Learner #{guest_uuid[:4].upper()}"

    guest_user = User(
        name=guest_name,
        email=guest_email,
        password_hash=get_password_hash(uuid.uuid4().hex),
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


# Legacy direct register fallback (kept for backward compatibility or direct API)
@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if user and user.is_verified and not user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    new_user = User(
        name=user_in.name,
        email=email_clean,
        password_hash=get_password_hash(user_in.password),
        avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.name}",
        is_verified=True,
        is_guest=False
    )
    db.add(new_user)
    db.flush()
    seed_user_initial_data(db, new_user, is_guest=False)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_verified and not user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not verified yet. Please complete email verification to sign in."
        )
    
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


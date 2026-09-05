from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.progress import UserVideoProgress
from app.schemas.progress import ProgressUpdate, ProgressOut

router = APIRouter(prefix="/progress", tags=["progress"])

@router.post("/update", response_model=ProgressOut)
def update_progress(
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == payload.video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id,
        UserVideoProgress.video_id == payload.video_id
    ).first()

    if not progress:
        progress = UserVideoProgress(
            user_id=current_user.id,
            video_id=payload.video_id,
            status="NOT_STARTED",
            watch_percentage=0.0,
            last_position=0.0
        )
        db.add(progress)

    if payload.watch_percentage is not None:
        progress.watch_percentage = max(0.0, min(100.0, float(payload.watch_percentage)))
    
    if payload.last_position is not None:
        progress.last_position = max(0.0, float(payload.last_position))

    # Automatic status determination if status not explicitly passed
    if payload.status:
        progress.status = payload.status
        if payload.status == "COMPLETED" and not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)
            if progress.watch_percentage < 90.0:
                progress.watch_percentage = 100.0
        elif payload.status != "COMPLETED":
            progress.completed_at = None
    else:
        # Automatic transition based on watch percentage
        if progress.watch_percentage >= 90.0:
            if progress.status != "COMPLETED":
                progress.status = "COMPLETED"
                progress.completed_at = datetime.now(timezone.utc)
        elif progress.watch_percentage >= 20.0 or progress.last_position > 30:
            if progress.status == "NOT_STARTED":
                progress.status = "IN_PROGRESS"

    progress.updated_at = datetime.now(timezone.utc)
    # Also update playlist updated_at to track activity
    video.playlist.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)

    return ProgressOut.model_validate(progress)

@router.post("/toggle-complete/{video_id}", response_model=ProgressOut)
def toggle_video_complete(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id,
        UserVideoProgress.video_id == video_id
    ).first()

    if not progress:
        progress = UserVideoProgress(
            user_id=current_user.id,
            video_id=video_id,
            status="COMPLETED",
            watch_percentage=100.0,
            last_position=0.0,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(progress)
    else:
        if progress.status == "COMPLETED":
            progress.status = "NOT_STARTED"
            progress.completed_at = None
            progress.watch_percentage = 0.0
        else:
            progress.status = "COMPLETED"
            progress.completed_at = datetime.now(timezone.utc)
            progress.watch_percentage = 100.0

    progress.updated_at = datetime.now(timezone.utc)
    video.playlist.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)

    return ProgressOut.model_validate(progress)

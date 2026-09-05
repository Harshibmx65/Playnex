from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.doubt import Doubt
from app.schemas.doubt import DoubtCreate, DoubtUpdate, DoubtOut, DoubtWithVideoOut
from app.services.youtube import format_seconds

router = APIRouter(prefix="/doubts", tags=["doubts"])

@router.get("", response_model=List[DoubtWithVideoOut])
@router.get("/", response_model=List[DoubtWithVideoOut])
def get_all_doubts(
    status_filter: Optional[str] = None,
    playlist_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Doubt).join(Video, Video.id == Doubt.video_id).filter(
        Doubt.user_id == current_user.id
    )

    if status_filter:
        query = query.filter(Doubt.status == status_filter.upper())
    
    if playlist_id:
        query = query.filter(Video.playlist_id == playlist_id)

    doubts = query.order_by(Doubt.created_at.desc()).all()
    results = []
    for d in doubts:
        results.append(DoubtWithVideoOut(
            id=d.id,
            user_id=d.user_id,
            video_id=d.video_id,
            timestamp=d.timestamp,
            timestamp_formatted=d.timestamp_formatted,
            title=d.title,
            description=d.description,
            status=d.status,
            resolution_notes=d.resolution_notes,
            created_at=d.created_at,
            resolved_at=d.resolved_at,
            video_title=d.video.title if d.video else None,
            youtube_video_id=d.video.youtube_video_id if d.video else None,
            playlist_id=d.video.playlist_id if d.video else None,
            playlist_title=d.video.playlist.title if d.video and d.video.playlist else None
        ))
    return results

@router.post("", response_model=DoubtOut)
@router.post("/", response_model=DoubtOut)
def create_doubt(
    payload: DoubtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == payload.video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    formatted = payload.timestamp_formatted
    if not formatted or formatted == "00:00":
        formatted = format_seconds(payload.timestamp)

    doubt = Doubt(
        user_id=current_user.id,
        video_id=payload.video_id,
        timestamp=payload.timestamp,
        timestamp_formatted=formatted,
        title=payload.title,
        description=payload.description,
        status="OPEN"
    )
    db.add(doubt)
    video.playlist.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doubt)

    return DoubtOut.model_validate(doubt)

@router.patch("/{doubt_id}", response_model=DoubtOut)
def update_doubt(
    doubt_id: int,
    payload: DoubtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doubt = db.query(Doubt).filter(
        Doubt.id == doubt_id,
        Doubt.user_id == current_user.id
    ).first()

    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")

    if payload.title is not None:
        doubt.title = payload.title
    if payload.description is not None:
        doubt.description = payload.description
    if payload.timestamp is not None:
        doubt.timestamp = payload.timestamp
        doubt.timestamp_formatted = format_seconds(payload.timestamp)
    if payload.timestamp_formatted is not None:
        doubt.timestamp_formatted = payload.timestamp_formatted
    if payload.resolution_notes is not None:
        doubt.resolution_notes = payload.resolution_notes
    if payload.status is not None:
        doubt.status = payload.status
        if payload.status == "RESOLVED" and not doubt.resolved_at:
            doubt.resolved_at = datetime.now(timezone.utc)
        elif payload.status == "OPEN":
            doubt.resolved_at = None

    db.commit()
    db.refresh(doubt)

    return DoubtOut.model_validate(doubt)

@router.post("/{doubt_id}/toggle-resolve", response_model=DoubtOut)
def toggle_resolve_doubt(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doubt = db.query(Doubt).filter(
        Doubt.id == doubt_id,
        Doubt.user_id == current_user.id
    ).first()

    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")

    if doubt.status == "RESOLVED":
        doubt.status = "OPEN"
        doubt.resolved_at = None
    else:
        doubt.status = "RESOLVED"
        doubt.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(doubt)
    return DoubtOut.model_validate(doubt)

@router.delete("/{doubt_id}")
def delete_doubt(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doubt = db.query(Doubt).filter(
        Doubt.id == doubt_id,
        Doubt.user_id == current_user.id
    ).first()

    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")

    db.delete(doubt)
    db.commit()
    return {"message": "Doubt deleted successfully"}

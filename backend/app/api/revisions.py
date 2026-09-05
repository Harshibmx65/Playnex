from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.revision import Revision
from app.schemas.revision import RevisionCreate, RevisionUpdate, RevisionOut, RevisionWithVideoOut

router = APIRouter(prefix="/revisions", tags=["revisions"])

@router.get("/queue", response_model=List[RevisionWithVideoOut])
def get_revision_queue(
    playlist_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Revision).join(Video, Video.id == Revision.video_id).filter(
        Revision.user_id == current_user.id
    )

    if status_filter:
        query = query.filter(Revision.status == status_filter.upper())
    else:
        # Default queue returns items needing revision or currently revising
        query = query.filter(Revision.status.in_(["NEED_REVISION", "REVISING"]))

    if playlist_id:
        query = query.filter(Video.playlist_id == playlist_id)

    # Sort priority HIGH > MEDIUM > LOW, then updated_at
    # In SQLite, order by CASE
    revisions = query.all()
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    revisions.sort(key=lambda r: (priority_order.get(r.priority, 1), r.created_at))

    results = []
    for r in revisions:
        results.append(RevisionWithVideoOut(
            id=r.id,
            user_id=r.user_id,
            video_id=r.video_id,
            status=r.status,
            priority=r.priority,
            notes=r.notes,
            last_revised_at=r.last_revised_at,
            created_at=r.created_at,
            updated_at=r.updated_at,
            video_title=r.video.title if r.video else None,
            youtube_video_id=r.video.youtube_video_id if r.video else None,
            duration=r.video.duration if r.video else None,
            playlist_id=r.video.playlist_id if r.video else None,
            playlist_title=r.video.playlist.title if r.video and r.video.playlist else None,
            video_position=r.video.position if r.video else None
        ))
    return results

@router.post("", response_model=RevisionOut)
@router.post("/", response_model=RevisionOut)
def toggle_or_create_revision(
    payload: RevisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == payload.video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    rev = db.query(Revision).filter(
        Revision.user_id == current_user.id,
        Revision.video_id == payload.video_id
    ).first()

    if not rev:
        rev = Revision(
            user_id=current_user.id,
            video_id=payload.video_id,
            status=payload.status or "NEED_REVISION",
            priority=payload.priority or "MEDIUM",
            notes=payload.notes
        )
        db.add(rev)
    else:
        # Update existing
        rev.status = payload.status or "NEED_REVISION"
        rev.priority = payload.priority or rev.priority
        if payload.notes is not None:
            rev.notes = payload.notes
        rev.updated_at = datetime.now(timezone.utc)

    video.playlist.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rev)

    return RevisionOut.model_validate(rev)

@router.patch("/{revision_id}", response_model=RevisionOut)
def update_revision(
    revision_id: int,
    payload: RevisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rev = db.query(Revision).filter(
        Revision.id == revision_id,
        Revision.user_id == current_user.id
    ).first()

    if not rev:
        raise HTTPException(status_code=404, detail="Revision entry not found")

    if payload.status is not None:
        rev.status = payload.status
        if payload.status == "REVISED":
            rev.last_revised_at = datetime.now(timezone.utc)
    if payload.priority is not None:
        rev.priority = payload.priority
    if payload.notes is not None:
        rev.notes = payload.notes

    rev.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rev)

    return RevisionOut.model_validate(rev)

@router.post("/mark-revised/{video_id}", response_model=RevisionOut)
def mark_video_revised(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rev = db.query(Revision).filter(
        Revision.user_id == current_user.id,
        Revision.video_id == video_id
    ).first()

    if not rev:
        rev = Revision(
            user_id=current_user.id,
            video_id=video_id,
            status="REVISED",
            priority="MEDIUM",
            last_revised_at=datetime.now(timezone.utc)
        )
        db.add(rev)
    else:
        rev.status = "REVISED"
        rev.last_revised_at = datetime.now(timezone.utc)
        rev.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(rev)
    return RevisionOut.model_validate(rev)

@router.delete("/video/{video_id}")
def remove_video_from_revision(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rev = db.query(Revision).filter(
        Revision.user_id == current_user.id,
        Revision.video_id == video_id
    ).first()

    if not rev:
        raise HTTPException(status_code=404, detail="Revision entry not found")

    db.delete(rev)
    db.commit()
    return {"message": "Video removed from revision queue"}

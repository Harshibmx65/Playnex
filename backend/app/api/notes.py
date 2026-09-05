from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut, NoteWithVideoOut
from app.services.youtube import format_seconds

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("", response_model=List[NoteWithVideoOut])
@router.get("/", response_model=List[NoteWithVideoOut])
def get_all_notes(
    playlist_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note).join(Video, Video.id == Note.video_id).filter(
        Note.user_id == current_user.id
    )

    if playlist_id:
        query = query.filter(Video.playlist_id == playlist_id)

    notes = query.order_by(Note.created_at.desc()).all()
    results = []
    for n in notes:
        results.append(NoteWithVideoOut(
            id=n.id,
            user_id=n.user_id,
            video_id=n.video_id,
            timestamp=n.timestamp,
            timestamp_formatted=n.timestamp_formatted,
            title=n.title,
            content=n.content,
            created_at=n.created_at,
            updated_at=n.updated_at,
            video_title=n.video.title if n.video else None,
            playlist_id=n.video.playlist_id if n.video else None,
            playlist_title=n.video.playlist.title if n.video and n.video.playlist else None
        ))
    return results

@router.post("", response_model=NoteOut)
@router.post("/", response_model=NoteOut)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == payload.video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    formatted = payload.timestamp_formatted
    if not formatted or formatted == "00:00":
        formatted = format_seconds(payload.timestamp)

    note = Note(
        user_id=current_user.id,
        video_id=payload.video_id,
        timestamp=payload.timestamp,
        timestamp_formatted=formatted,
        title=payload.title,
        content=payload.content
    )
    db.add(note)
    video.playlist.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)

    return NoteOut.model_validate(note)

@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
    if payload.timestamp is not None:
        note.timestamp = payload.timestamp
        note.timestamp_formatted = format_seconds(payload.timestamp)
    if payload.timestamp_formatted is not None:
        note.timestamp_formatted = payload.timestamp_formatted

    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)

    return NoteOut.model_validate(note)

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

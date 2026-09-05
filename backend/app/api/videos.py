from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.note import Note
from app.models.doubt import Doubt
from app.schemas.video import VideoDetailOut
from app.schemas.note import NoteOut
from app.schemas.doubt import DoubtOut
from app.api.playlists import build_video_out

router = APIRouter(prefix="/videos", tags=["videos"])

@router.get("/{video_id}", response_model=VideoDetailOut)
def get_video_detail(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    video_base = build_video_out(video, current_user.id, db)

    # Fetch notes
    notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.video_id == video.id
    ).order_by(Note.timestamp.asc(), Note.created_at.asc()).all()
    notes_out = [NoteOut.model_validate(n) for n in notes]

    # Fetch doubts
    doubts = db.query(Doubt).filter(
        Doubt.user_id == current_user.id,
        Doubt.video_id == video.id
    ).order_by(Doubt.timestamp.asc(), Doubt.created_at.asc()).all()
    doubts_out = [DoubtOut.model_validate(d) for d in doubts]

    return VideoDetailOut(
        **video_base.model_dump(),
        notes=notes_out,
        doubts=doubts_out
    )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.tag import Tag, VideoTag
from app.schemas.tag import TagCreate, TagOut, VideoTagAssign

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("", response_model=List[TagOut])
@router.get("/", response_model=List[TagOut])
def get_user_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.name.asc()).all()
    return [TagOut.model_validate(t) for t in tags]

@router.post("", response_model=TagOut)
@router.post("/", response_model=TagOut)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name_clean = payload.name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty")

    existing = db.query(Tag).filter(
        Tag.user_id == current_user.id,
        Tag.name.ilike(name_clean)
    ).first()

    if existing:
        return TagOut.model_validate(existing)

    tag = Tag(
        user_id=current_user.id,
        name=name_clean,
        color=payload.color or "indigo"
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)

    return TagOut.model_validate(tag)

@router.post("/video/{video_id}/assign", response_model=List[TagOut])
def assign_tags_to_video(
    video_id: int,
    payload: VideoTagAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or video.playlist.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    # Clear existing video tags for this user's tags
    user_tag_ids = [t.id for t in db.query(Tag.id).filter(Tag.user_id == current_user.id).all()]
    db.query(VideoTag).filter(
        VideoTag.video_id == video_id,
        VideoTag.tag_id.in_(user_tag_ids)
    ).delete(synchronize_session=False)

    # Insert new tags
    for t_id in payload.tag_ids:
        if t_id in user_tag_ids:
            vt = VideoTag(video_id=video_id, tag_id=t_id)
            db.add(vt)

    db.commit()

    # Return updated tags for the video
    v_tags = db.query(Tag).join(VideoTag, VideoTag.tag_id == Tag.id).filter(
        VideoTag.video_id == video_id,
        Tag.user_id == current_user.id
    ).all()

    return [TagOut.model_validate(t) for t in v_tags]

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted successfully"}

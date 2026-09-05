from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.playlist import Playlist
from app.models.video import Video
from app.models.progress import UserVideoProgress
from app.models.tag import Tag, VideoTag
from app.models.note import Note
from app.models.doubt import Doubt
from app.models.revision import Revision
from app.schemas.playlist import PlaylistImport, PlaylistSummaryOut, PlaylistDetailOut, PlaylistUpdate
from app.schemas.video import VideoOut
from app.schemas.tag import TagOut
from app.schemas.progress import ProgressOut
from app.schemas.revision import RevisionOut
from app.services.youtube import YouTubeService

router = APIRouter(prefix="/playlists", tags=["playlists"])

def format_duration_hours(seconds: int) -> str:
    if not seconds or seconds <= 0:
        return "0h"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours == 0:
        return f"{minutes}m"
    if minutes == 0:
        return f"{hours}h"
    return f"{hours}h {minutes}m"

def build_video_out(video: Video, user_id: int, db: Session) -> VideoOut:
    # 1. Progress
    prog = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == user_id,
        UserVideoProgress.video_id == video.id
    ).first()

    progress_out = None
    if prog:
        progress_out = ProgressOut.model_validate(prog)
    else:
        progress_out = ProgressOut(
            id=0,
            user_id=user_id,
            video_id=video.id,
            status="NOT_STARTED",
            watch_percentage=0.0,
            last_position=0.0,
            completed_at=None,
            updated_at=datetime.now(timezone.utc)
        )

    # 2. Tags
    v_tags = db.query(Tag).join(VideoTag, VideoTag.tag_id == Tag.id).filter(
        VideoTag.video_id == video.id,
        Tag.user_id == user_id
    ).all()
    tags_out = [TagOut.model_validate(t) for t in v_tags]

    # 3. Notes count
    notes_count = db.query(Note).filter(
        Note.user_id == user_id,
        Note.video_id == video.id
    ).count()

    # 4. Doubts count
    doubts = db.query(Doubt).filter(
        Doubt.user_id == user_id,
        Doubt.video_id == video.id
    ).all()
    doubts_count = len(doubts)
    open_doubts_count = sum(1 for d in doubts if d.status == "OPEN")

    # 5. Revision
    rev = db.query(Revision).filter(
        Revision.user_id == user_id,
        Revision.video_id == video.id
    ).first()
    revision_out = RevisionOut.model_validate(rev) if rev else None

    return VideoOut(
        id=video.id,
        playlist_id=video.playlist_id,
        youtube_video_id=video.youtube_video_id,
        title=video.title,
        thumbnail=video.thumbnail,
        duration=video.duration,
        duration_seconds=video.duration_seconds,
        position=video.position,
        description=video.description,
        created_at=video.created_at,
        progress=progress_out,
        tags=tags_out,
        notes_count=notes_count,
        doubts_count=doubts_count,
        open_doubts_count=open_doubts_count,
        revision=revision_out
    )

def build_playlist_summary(playlist: Playlist, user_id: int, db: Session) -> PlaylistSummaryOut:
    videos = playlist.videos or []
    total_videos = len(videos)
    video_ids = [v.id for v in videos]
    total_duration_seconds = sum(v.duration_seconds or 0 for v in videos)
    total_duration_formatted = format_duration_hours(total_duration_seconds)

    if total_videos == 0:
        return PlaylistSummaryOut(
            id=playlist.id,
            user_id=playlist.user_id,
            youtube_playlist_id=playlist.youtube_playlist_id,
            title=playlist.title,
            description=playlist.description,
            thumbnail=playlist.thumbnail,
            channel_name=playlist.channel_name,
            video_count=0,
            created_at=playlist.created_at,
            updated_at=playlist.updated_at,
            total_videos=0,
            completed_videos=0,
            in_progress_videos=0,
            not_started_videos=0,
            progress_percentage=0.0,
            total_duration_seconds=0,
            total_duration_formatted="0h",
            completed_duration_seconds=0,
            completed_duration_formatted="0h",
            last_watched_video=None,
            last_watched_video_id=None,
            last_activity=playlist.updated_at,
            doubts_count=0,
            open_doubts_count=0,
            revisions_count=0,
            notes_count=0,
            tags_count=0
        )

    # Fetch progress records
    progress_records = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == user_id,
        UserVideoProgress.video_id.in_(video_ids)
    ).all()
    
    prog_map = {p.video_id: p for p in progress_records}

    completed_videos = sum(1 for p in progress_records if p.status == "COMPLETED")
    in_progress_videos = sum(1 for p in progress_records if p.status == "IN_PROGRESS")
    not_started_videos = total_videos - completed_videos - in_progress_videos

    completed_duration_seconds = sum(
        v.duration_seconds or 0 for v in videos
        if prog_map.get(v.id) and prog_map[v.id].status == "COMPLETED"
    )
    completed_duration_formatted = format_duration_hours(completed_duration_seconds)

    progress_percentage = round((completed_videos / total_videos) * 100.0, 1) if total_videos > 0 else 0.0

    # Find last watched video
    last_prog = None
    if progress_records:
        active_records = [p for p in progress_records if p.updated_at]
        if active_records:
            last_prog = max(active_records, key=lambda x: x.updated_at)
            
    last_watched_title = None
    last_watched_id = None
    last_activity = playlist.updated_at

    if last_prog:
        last_watched_id = last_prog.video_id
        matched_v = next((v for v in videos if v.id == last_prog.video_id), None)
        if matched_v:
            last_watched_title = matched_v.title
        last_activity = last_prog.updated_at
    elif videos:
        last_watched_id = videos[0].id
        last_watched_title = videos[0].title

    # Counts
    doubts = db.query(Doubt).filter(
        Doubt.user_id == user_id,
        Doubt.video_id.in_(video_ids)
    ).all()
    doubts_count = len(doubts)
    open_doubts_count = sum(1 for d in doubts if d.status == "OPEN")

    revisions_count = db.query(Revision).filter(
        Revision.user_id == user_id,
        Revision.video_id.in_(video_ids),
        Revision.status.in_(["NEED_REVISION", "REVISING"])
    ).count()

    notes_count = db.query(Note).filter(
        Note.user_id == user_id,
        Note.video_id.in_(video_ids)
    ).count()

    tags_count = db.query(VideoTag.tag_id).distinct().join(Video, Video.id == VideoTag.video_id).filter(
        Video.playlist_id == playlist.id
    ).count()

    return PlaylistSummaryOut(
        id=playlist.id,
        user_id=playlist.user_id,
        youtube_playlist_id=playlist.youtube_playlist_id,
        title=playlist.title,
        description=playlist.description,
        thumbnail=playlist.thumbnail,
        channel_name=playlist.channel_name,
        video_count=total_videos,
        created_at=playlist.created_at,
        updated_at=playlist.updated_at,
        total_videos=total_videos,
        completed_videos=completed_videos,
        in_progress_videos=in_progress_videos,
        not_started_videos=not_started_videos,
        progress_percentage=progress_percentage,
        total_duration_seconds=total_duration_seconds,
        total_duration_formatted=total_duration_formatted,
        completed_duration_seconds=completed_duration_seconds,
        completed_duration_formatted=completed_duration_formatted,
        last_watched_video=last_watched_title,
        last_watched_video_id=last_watched_id,
        last_activity=last_activity,
        doubts_count=doubts_count,
        open_doubts_count=open_doubts_count,
        revisions_count=revisions_count,
        notes_count=notes_count,
        tags_count=tags_count
    )

def sync_playlist_data(playlist: Playlist, data: dict, db: Session) -> dict:
    """
    Synchronizes an existing playlist with fresh YouTube data.
    - Updates playlist metadata (title, description, thumbnail, channel_name)
    - Updates existing videos (title, thumbnail, duration, duration_seconds, position, description)
    - Inserts newly added videos from YouTube
    - Deletes videos that were removed or privatized by the creator on YouTube
    - Updates total video_count and updated_at timestamp
    """
    playlist.title = data.get("title") or playlist.title
    if data.get("description"):
        playlist.description = data["description"]
    if data.get("thumbnail"):
        playlist.thumbnail = data["thumbnail"]
    if data.get("channel_name"):
        playlist.channel_name = data["channel_name"]

    fetched_videos = data.get("videos", [])
    fetched_video_map = {item["youtube_video_id"]: item for item in fetched_videos}
    
    # Existing videos in DB
    existing_videos = {v.youtube_video_id: v for v in playlist.videos}
    
    added_count = 0
    updated_count = 0
    removed_count = 0

    # 1. Update existing and insert newly added videos
    for item in fetched_videos:
        y_id = item["youtube_video_id"]
        if y_id in existing_videos:
            v = existing_videos[y_id]
            v.title = item["title"]
            v.thumbnail = item.get("thumbnail") or v.thumbnail
            v.duration = item.get("duration") or v.duration
            v.duration_seconds = item.get("duration_seconds") if item.get("duration_seconds") is not None else v.duration_seconds
            v.position = item.get("position", v.position)
            if item.get("description"):
                v.description = item["description"]
            updated_count += 1
        else:
            new_v = Video(
                playlist_id=playlist.id,
                youtube_video_id=y_id,
                title=item["title"],
                thumbnail=item.get("thumbnail", ""),
                duration=item.get("duration", "00:00"),
                duration_seconds=item.get("duration_seconds", 0),
                position=item.get("position", 0),
                description=item.get("description", "")
            )
            db.add(new_v)
            added_count += 1

    # 2. Delete videos removed/deleted by creator from the playlist
    for y_id, v in list(existing_videos.items()):
        if y_id not in fetched_video_map:
            db.delete(v)
            removed_count += 1

    playlist.video_count = len(fetched_videos)
    playlist.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(playlist)

    return {
        "added": added_count,
        "updated": updated_count,
        "removed": removed_count,
        "total": len(fetched_videos)
    }

@router.get("", response_model=List[PlaylistSummaryOut])
@router.get("/", response_model=List[PlaylistSummaryOut])
def get_user_playlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlists = db.query(Playlist).filter(
        Playlist.user_id == current_user.id
    ).order_by(Playlist.updated_at.desc()).all()

    return [build_playlist_summary(p, current_user.id, db) for p in playlists]

@router.post("", response_model=PlaylistDetailOut)
@router.post("/", response_model=PlaylistDetailOut)
@router.post("/import", response_model=PlaylistDetailOut)
async def import_playlist(
    payload: PlaylistImport,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Please provide a valid YouTube playlist URL.")

    try:
        data = await YouTubeService.fetch_playlist(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not import YouTube playlist: {str(e)}")

    # Check if this playlist is already imported by this user
    existing = db.query(Playlist).filter(
        Playlist.user_id == current_user.id,
        Playlist.youtube_playlist_id == data["youtube_playlist_id"]
    ).first()

    if existing:
        sync_playlist_data(existing, data, db)
        playlist = existing
    else:
        playlist = Playlist(
            user_id=current_user.id,
            youtube_playlist_id=data["youtube_playlist_id"],
            title=data["title"],
            description=data.get("description", ""),
            thumbnail=data.get("thumbnail", ""),
            channel_name=data.get("channel_name", "YouTube Creator"),
            video_count=data["video_count"]
        )
        db.add(playlist)
        db.flush()

        # Add videos
        for item in data.get("videos", []):
            new_v = Video(
                playlist_id=playlist.id,
                youtube_video_id=item["youtube_video_id"],
                title=item["title"],
                thumbnail=item.get("thumbnail", ""),
                duration=item.get("duration", "00:00"),
                duration_seconds=item.get("duration_seconds", 0),
                position=item.get("position", 0),
                description=item.get("description", "")
            )
            db.add(new_v)

        db.commit()
        db.refresh(playlist)

    # Build response
    summary = build_playlist_summary(playlist, current_user.id, db)
    videos_out = [build_video_out(v, current_user.id, db) for v in playlist.videos]

    return PlaylistDetailOut(
        **summary.model_dump(),
        videos=videos_out
    )

@router.post("/{playlist_id}/sync", response_model=PlaylistDetailOut)
async def sync_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    try:
        data = await YouTubeService.fetch_playlist(playlist.youtube_playlist_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync playlist from YouTube: {str(e)}")

    sync_playlist_data(playlist, data, db)

    summary = build_playlist_summary(playlist, current_user.id, db)
    videos_out = [build_video_out(v, current_user.id, db) for v in playlist.videos]

    return PlaylistDetailOut(
        **summary.model_dump(),
        videos=videos_out
    )

@router.get("/{playlist_id}", response_model=PlaylistDetailOut)
def get_playlist_detail(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    summary = build_playlist_summary(playlist, current_user.id, db)
    videos_out = [build_video_out(v, current_user.id, db) for v in playlist.videos]

    return PlaylistDetailOut(
        **summary.model_dump(),
        videos=videos_out
    )

@router.patch("/{playlist_id}", response_model=PlaylistSummaryOut)
def update_playlist(
    playlist_id: int,
    payload: PlaylistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if payload.title is not None:
        playlist.title = payload.title
    if payload.description is not None:
        playlist.description = payload.description

    playlist.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(playlist)

    return build_playlist_summary(playlist, current_user.id, db)

@router.delete("/{playlist_id}")
def delete_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    db.delete(playlist)
    db.commit()
    return {"message": "Playlist deleted successfully"}

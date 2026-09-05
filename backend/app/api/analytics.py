from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.playlist import Playlist
from app.models.video import Video
from app.models.progress import UserVideoProgress
from app.models.note import Note
from app.models.doubt import Doubt
from app.models.revision import Revision
from app.schemas.analytics import GlobalDashboardStats, RecentActivity
from app.schemas.revision import RevisionWithVideoOut
from app.schemas.doubt import DoubtWithVideoOut
from app.api.playlists import build_playlist_summary, format_duration_hours

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=GlobalDashboardStats)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Playlists
    playlists = db.query(Playlist).filter(
        Playlist.user_id == current_user.id
    ).order_by(Playlist.updated_at.desc()).all()

    total_playlists = len(playlists)
    playlist_ids = [p.id for p in playlists]

    # 2. Total Videos
    videos = db.query(Video).filter(Video.playlist_id.in_(playlist_ids)).all() if playlist_ids else []
    total_videos = len(videos)
    video_ids = [v.id for v in videos]
    total_duration_seconds = sum(v.duration_seconds or 0 for v in videos)
    total_duration_formatted = format_duration_hours(total_duration_seconds)

    # 3. Progress counts & duration
    progress_records = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id
    ).all()

    completed_videos = sum(1 for p in progress_records if p.status == "COMPLETED")
    in_progress_videos = sum(1 for p in progress_records if p.status == "IN_PROGRESS")
    not_started_videos = max(0, total_videos - completed_videos - in_progress_videos)

    completed_vid_ids = {p.video_id for p in progress_records if p.status == "COMPLETED"}
    completed_duration_seconds = sum(v.duration_seconds or 0 for v in videos if v.id in completed_vid_ids)
    completed_duration_formatted = format_duration_hours(completed_duration_seconds)

    overall_completion = round((completed_videos / total_videos) * 100.0, 1) if total_videos > 0 else 0.0

    # 4. Open Doubts
    open_doubts_count = db.query(Doubt).filter(
        Doubt.user_id == current_user.id,
        Doubt.status == "OPEN"
    ).count()

    # 5. Revisions
    need_revision_count = db.query(Revision).filter(
        Revision.user_id == current_user.id,
        Revision.status.in_(["NEED_REVISION", "REVISING"])
    ).count()

    # 6. Notes
    total_notes_count = db.query(Note).filter(
        Note.user_id == current_user.id
    ).count()

    # 7. Continue Learning (most recently active progress)
    continue_learning = None
    if progress_records:
        active_progress = [p for p in progress_records if p.updated_at and p.video]
        if active_progress:
            most_recent_p = max(active_progress, key=lambda p: p.updated_at)
            v = most_recent_p.video
            if v and v.playlist:
                continue_learning = RecentActivity(
                    video_id=v.id,
                    video_title=v.title,
                    youtube_video_id=v.youtube_video_id,
                    playlist_id=v.playlist.id,
                    playlist_title=v.playlist.title,
                    last_position=most_recent_p.last_position,
                    watch_percentage=most_recent_p.watch_percentage,
                    status=most_recent_p.status,
                    updated_at=most_recent_p.updated_at
                )
    
    # Fallback to first video of first playlist if no progress yet
    if not continue_learning and playlists and playlists[0].videos:
        first_v = playlists[0].videos[0]
        continue_learning = RecentActivity(
            video_id=first_v.id,
            video_title=first_v.title,
            youtube_video_id=first_v.youtube_video_id,
            playlist_id=playlists[0].id,
            playlist_title=playlists[0].title,
            last_position=0.0,
            watch_percentage=0.0,
            status="NOT_STARTED",
            updated_at=playlists[0].updated_at
        )

    # 8. Top Revision Queue
    revisions_raw = db.query(Revision).join(Video, Video.id == Revision.video_id).filter(
        Revision.user_id == current_user.id,
        Revision.status.in_(["NEED_REVISION", "REVISING"])
    ).all()
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    revisions_raw.sort(key=lambda r: (priority_order.get(r.priority, 1), r.created_at))
    
    revision_queue = []
    for r in revisions_raw[:6]:
        revision_queue.append(RevisionWithVideoOut(
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

    # 9. Top Unresolved Doubts
    doubts_raw = db.query(Doubt).join(Video, Video.id == Doubt.video_id).filter(
        Doubt.user_id == current_user.id,
        Doubt.status == "OPEN"
    ).order_by(Doubt.created_at.desc()).limit(6).all()

    unresolved_doubts = []
    for d in doubts_raw:
        unresolved_doubts.append(DoubtWithVideoOut(
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

    # 10. Recent playlists
    recent_playlists = [build_playlist_summary(p, current_user.id, db) for p in playlists[:6]]

    return GlobalDashboardStats(
        total_playlists=total_playlists,
        total_videos=total_videos,
        completed_videos=completed_videos,
        in_progress_videos=in_progress_videos,
        not_started_videos=not_started_videos,
        overall_completion_percentage=overall_completion,
        total_duration_seconds=total_duration_seconds,
        total_duration_formatted=total_duration_formatted,
        completed_duration_seconds=completed_duration_seconds,
        completed_duration_formatted=completed_duration_formatted,
        open_doubts_count=open_doubts_count,
        need_revision_count=need_revision_count,
        total_notes_count=total_notes_count,
        continue_learning=continue_learning,
        recent_playlists=recent_playlists,
        revision_queue=revision_queue,
        unresolved_doubts=unresolved_doubts
    )

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.playlist import Playlist
from app.models.video import Video
from app.api.playlists import sync_playlist_data, format_duration_hours

client = TestClient(app)

def test_sync_and_duration():
    print("\n--- 1. Login ---")
    res = client.post("/api/auth/login", json={"email": "demo@learner.com", "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Verify Playlist Duration in Summary & Detail ---")
    res = client.get("/api/playlists", headers=headers)
    assert res.status_code == 200
    playlists = res.json()
    pl = playlists[0]
    print(f"Playlist '{pl['title']}': total_duration_seconds={pl['total_duration_seconds']} ({pl['total_duration_formatted']})")
    assert pl["total_duration_seconds"] > 0
    assert "h" in pl["total_duration_formatted"] or "m" in pl["total_duration_formatted"]

    print("\n--- 3. Testing Dynamic Sync (Adding, Updating, Removing Videos) ---")
    db = SessionLocal()
    try:
        db_pl = db.query(Playlist).filter(Playlist.id == pl["id"]).first()
        initial_video_count = len(db_pl.videos)
        initial_total_dur = sum(v.duration_seconds for v in db_pl.videos)
        print(f"Initial DB videos count: {initial_video_count}, total duration: {initial_total_dur}s")

        # Simulate YouTube response where:
        # - Video 1 is updated (new duration, new title)
        # - Video 2 is kept
        # - Video 3 is REMOVED by creator
        # - A NEW video (Video 7) is ADDED by creator
        vid1_yid = db_pl.videos[0].youtube_video_id
        vid2_yid = db_pl.videos[1].youtube_video_id
        
        simulated_yt_data = {
            "title": db_pl.title + " (Synced)",
            "description": "Updated description from YouTube",
            "thumbnail": db_pl.thumbnail,
            "channel_name": db_pl.channel_name,
            "videos": [
                {
                    "youtube_video_id": vid1_yid,
                    "title": "Introduction to FastAPI & Async Python - Updated Edition",
                    "thumbnail": "https://example.com/thumb1.jpg",
                    "duration": "20:00",
                    "duration_seconds": 1200,
                    "position": 1,
                    "description": "New intro video"
                },
                {
                    "youtube_video_id": vid2_yid,
                    "title": db_pl.videos[1].title,
                    "thumbnail": db_pl.videos[1].thumbnail,
                    "duration": db_pl.videos[1].duration,
                    "duration_seconds": db_pl.videos[1].duration_seconds,
                    "position": 2,
                    "description": db_pl.videos[1].description
                },
                {
                    "youtube_video_id": "NEW_VIDEO_XYZ_123",
                    "title": "Newly Added FastAPI 2026 Features",
                    "thumbnail": "https://example.com/new_thumb.jpg",
                    "duration": "15:30",
                    "duration_seconds": 930,
                    "position": 3,
                    "description": "Brand new tutorial"
                }
            ]
        }

        sync_result = sync_playlist_data(db_pl, simulated_yt_data, db)
        print(f"[OK] Sync executed: Added={sync_result['added']}, Updated={sync_result['updated']}, Removed={sync_result['removed']}, Total={sync_result['total']}")
        assert sync_result["added"] == 1
        assert sync_result["removed"] == initial_video_count - 2 # All other previous videos removed
        assert sync_result["total"] == 3

        # Verify through API
        res = client.get(f"/api/playlists/{pl['id']}", headers=headers)
        assert res.status_code == 200
        detail = res.json()
        assert len(detail["videos"]) == 3
        assert detail["total_videos"] == 3
        assert detail["total_duration_seconds"] == 1200 + simulated_yt_data["videos"][1]["duration_seconds"] + 930
        print(f"[OK] API returned updated playlist detail with 3 videos and total duration: {detail['total_duration_formatted']} ({detail['total_duration_seconds']}s)")

    finally:
        db.close()

    print("\n--- 4. Testing Re-seed Database to restore demo state ---")
    from app.seed import seed_database
    seed_database()
    print("[OK] Database restored to pristine demo state")

    print("\n*** ALL SYNC AND DURATION TESTS PASSED! ***\n")

if __name__ == "__main__":
    test_sync_and_duration()

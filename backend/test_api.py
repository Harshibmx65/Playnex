import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_api_suite():
    print("\n--- 1. Testing Auth Login ---")
    res = client.post("/api/auth/login", json={"email": "demo@learner.com", "password": "password123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Login successful, JWT token obtained")

    print("\n--- 2. Testing Auth /me ---")
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "demo@learner.com"
    print("[OK] /api/auth/me verified:", res.json()["name"])

    print("\n--- 3. Testing Global Dashboard Analytics ---")
    res = client.get("/api/analytics/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_playlists"] >= 3
    assert data["total_videos"] >= 10
    print(f"[OK] Dashboard KPIs: Playlists={data['total_playlists']}, Total Videos={data['total_videos']}, Completed={data['completed_videos']}, Open Doubts={data['open_doubts_count']}")

    print("\n--- 4. Testing Playlists List ---")
    res = client.get("/api/playlists", headers=headers)
    assert res.status_code == 200
    playlists = res.json()
    assert len(playlists) >= 3
    first_pl = playlists[0]
    print(f"[OK] Playlists fetched: {len(playlists)} items. First playlist: '{first_pl['title']}' ({first_pl['progress_percentage']}% complete)")

    print("\n--- 5. Testing Playlist Detail ---")
    res = client.get(f"/api/playlists/{first_pl['id']}", headers=headers)
    assert res.status_code == 200
    detail = res.json()
    assert len(detail["videos"]) > 0
    first_vid = detail["videos"][0]
    print(f"[OK] Playlist detail loaded with {len(detail['videos'])} videos. Video #1: '{first_vid['title']}'")

    print("\n--- 6. Testing Progress Update ---")
    res = client.post(
        "/api/progress/update",
        headers=headers,
        json={"video_id": first_vid["id"], "watch_percentage": 95.0, "last_position": 850.0}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"
    print("[OK] Auto-completed video via watch percentage >= 90%")

    print("\n--- 7. Testing Notes CRUD ---")
    res = client.post(
        "/api/notes",
        headers=headers,
        json={"video_id": first_vid["id"], "timestamp": 125.0, "title": "Key Concept", "content": "Async functions yield execution during IO."}
    )
    assert res.status_code == 200
    note_id = res.json()["id"]
    print(f"[OK] Created Note #{note_id} with timestamp {res.json()['timestamp_formatted']}")

    res = client.get(f"/api/notes?playlist_id={first_pl['id']}", headers=headers)
    assert res.status_code == 200
    assert any(n["id"] == note_id for n in res.json())
    print("[OK] Note listed in playlist notes")

    print("\n--- 8. Testing Doubts CRUD & Resolve ---")
    res = client.post(
        "/api/doubts",
        headers=headers,
        json={"video_id": first_vid["id"], "timestamp": 200.0, "title": "Test Doubt", "description": "Is this tested?"}
    )
    assert res.status_code == 200
    doubt_id = res.json()["id"]
    print(f"[OK] Created Doubt #{doubt_id}")

    res = client.post(f"/api/doubts/{doubt_id}/toggle-resolve", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "RESOLVED"
    print(f"[OK] Doubt #{doubt_id} resolved successfully")

    print("\n--- 9. Testing Revision Queue ---")
    res = client.get("/api/revisions/queue", headers=headers)
    assert res.status_code == 200
    rev_queue = res.json()
    print(f"[OK] Revision queue contains {len(rev_queue)} items needing revision")

    print("\n--- 10. Testing Tags ---")
    res = client.get("/api/tags", headers=headers)
    assert res.status_code == 200
    tags = res.json()
    assert len(tags) > 0
    print(f"[OK] Tags fetched: {[t['name'] for t in tags]}")

    print("\n*** ALL BACKEND API TESTS PASSED PERFECTLY! ***\n")

if __name__ == "__main__":
    test_full_api_suite()

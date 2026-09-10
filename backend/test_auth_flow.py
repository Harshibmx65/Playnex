import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.playlist import Playlist

client = TestClient(app)

def test_full_auth_flow():
    print("\n" + "="*65)
    print("RUNNING PLAYNEX AUTHENTICATION & DATA SECURITY TEST SUITE")
    print("="*65)

    test_email = "alex.secured.user@example.com"
    test_name = "Alex Secured"
    valid_password = "StrongPassword2026!"

    # Clean up any existing test records
    db = SessionLocal()
    try:
        user1 = db.query(User).filter(User.email == test_email).first()
        if user1:
            db.delete(user1)
        user2 = db.query(User).filter(User.email == "other.user@example.com").first()
        if user2:
            db.delete(user2)
        db.commit()
    finally:
        db.close()

    # --- 1. Password Complexity Validation Tests ---
    print("\n[TEST 1] Testing Password Validation: Length < 8 rejection...")
    res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": "Pass1!"  # only 6 chars
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 422, f"Expected 422 for short password, got {res.status_code}"

    print("\n[TEST 2] Testing Password Validation: Missing Uppercase letter rejection...")
    res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": "lowercase_password_123!"
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 422, f"Expected 422 for missing uppercase, got {res.status_code}"

    print("\n[TEST 3] Testing Password Validation: Missing Lowercase letter rejection...")
    res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": "ALL_UPPERCASE_PASSWORD_123!"
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 422, f"Expected 422 for missing lowercase, got {res.status_code}"

    print("\n[TEST 4] Testing Password Validation: Missing Special Character rejection...")
    res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": "StrongPasswordNoSpecial123"
    })
    print(f"Status: {res.status_code}")
    assert res.status_code == 422, f"Expected 422 for missing special character, got {res.status_code}"

    # --- 2. Valid Registration ---
    print("\n[TEST 5] Testing Successful Direct Registration with Strong Password...")
    res_reg = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": valid_password
    })
    print(f"Status: {res_reg.status_code}, User: {res_reg.json().get('user', {}).get('name')}")
    assert res_reg.status_code == 200, f"Expected 200, got {res_reg.status_code}: {res_reg.text}"
    user_token = res_reg.json()["access_token"]
    user_id = res_reg.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {user_token}"}
    assert res_reg.json()["user"]["email"] == test_email
    assert res_reg.json()["user"]["is_verified"] is True
    assert res_reg.json()["user"]["is_guest"] is False

    # --- 3. Duplicate Registration Prevention ---
    print("\n[TEST 6] Testing Duplicate Registration Prevention...")
    res_dup = client.post("/api/auth/register", json={
        "name": "Duplicate User",
        "email": test_email,
        "password": "AnotherStrongPassword123!"
    })
    print(f"Status: {res_dup.status_code}, Detail: {res_dup.json().get('detail')}")
    assert res_dup.status_code == 400

    # --- 4. Login Tests ---
    print("\n[TEST 7] Testing Login with Invalid Password...")
    res_bad_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "WrongPassword123!"
    })
    print(f"Status: {res_bad_login.status_code}, Detail: {res_bad_login.json().get('detail')}")
    assert res_bad_login.status_code == 401

    print("\n[TEST 8] Testing Login with Valid Credentials...")
    res_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": valid_password
    })
    print(f"Status: {res_login.status_code}, Token obtained: {'access_token' in res_login.json()}")
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    # --- 5. Authenticated Profile Access ---
    print("\n[TEST 9] Testing /auth/me with Bearer token...")
    res_me = client.get("/api/auth/me", headers=headers)
    print(f"Status: {res_me.status_code}, Me Name: {res_me.json().get('name')}")
    assert res_me.status_code == 200
    assert res_me.json()["email"] == test_email

    # --- 6. Guest Session ---
    print("\n[TEST 10] Testing Guest Login...")
    res_guest = client.post("/api/auth/guest-login")
    print(f"Status: {res_guest.status_code}, Guest: {res_guest.json().get('user', {}).get('name')}")
    assert res_guest.status_code == 200
    guest_token = res_guest.json()["access_token"]
    assert res_guest.json()["user"]["is_guest"] is True

    # --- 7. Multi-Tenant User Data Isolation Test ---
    print("\n[TEST 11] Testing End-to-End User Data Isolation (User A vs User B)...")
    # Register second user
    res_user2 = client.post("/api/auth/register", json={
        "name": "Other User",
        "email": "other.user@example.com",
        "password": "SecondUserPass123!"
    })
    assert res_user2.status_code == 200
    user2_token = res_user2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {user2_token}"}

    # Fetch user 1's playlists
    res_pl1 = client.get("/api/playlists", headers=headers)
    user1_playlists = res_pl1.json()
    assert len(user1_playlists) >= 1
    user1_pl_id = user1_playlists[0]["id"]

    # Try accessing user 1's playlist using user 2's token (should be 404 forbidden / isolated)
    res_unauth_access = client.get(f"/api/playlists/{user1_pl_id}", headers=headers2)
    print(f"User 2 attempting to access User 1's playlist -> Status: {res_unauth_access.status_code}")
    assert res_unauth_access.status_code == 404, "User 2 should NOT be able to access User 1's playlist!"

    print("\n" + "="*65)
    print("ALL 11 AUTH, PASSWORD VALIDATION & DATA SECURITY TESTS PASSED! (11/11)")
    print("="*65 + "\n")

if __name__ == "__main__":
    test_full_auth_flow()


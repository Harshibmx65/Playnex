import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.otp import OtpVerification

client = TestClient(app)

def test_full_auth_flow():
    print("\n" + "="*60)
    print("RUNNING PLAYNEX AUTHENTICATION SUITE")
    print("="*60)

    # 1. Test Send OTP for new user
    test_email = "alex.test.user@example.com"
    test_name = "Alex Test"
    test_password = "SecurePassword123!"

    # Clean up any existing test records
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == test_email).delete()
        db.query(OtpVerification).filter(OtpVerification.email == test_email).delete()
        db.commit()
    finally:
        db.close()

    print("\n[TEST 1] Sending Registration OTP...")
    res = client.post("/api/auth/register/send-otp", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "email" in res.json()
    assert res.json()["email"] == test_email

    # 2. Test Cooldown Rate Limit on immediate resend
    print("\n[TEST 2] Testing Resend Cooldown Rate-Limiting...")
    res_cooldown = client.post("/api/auth/register/send-otp", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    })
    print(f"Status: {res_cooldown.status_code}, Response: {res_cooldown.json()}")
    assert res_cooldown.status_code == 429, f"Expected 429 Too Many Requests, got {res_cooldown.status_code}"

    # 3. Retrieve generated OTP from DB for testing
    db = SessionLocal()
    otp_record = db.query(OtpVerification).filter(
        OtpVerification.email == test_email,
        OtpVerification.is_used == False
    ).order_by(OtpVerification.created_at.desc()).first()
    db.close()

    assert otp_record is not None, "OTP record was not saved to database!"
    actual_otp = otp_record.otp_code
    print(f"\n[INFO] Generated OTP code from DB: {actual_otp}")

    # 4. Test Invalid OTP Attempt (Brute-force protection counter)
    print("\n[TEST 3] Testing Invalid OTP entry...")
    res_invalid = client.post("/api/auth/register/verify-otp", json={
        "email": test_email,
        "otp_code": "000000"
    })
    print(f"Status: {res_invalid.status_code}, Response: {res_invalid.json()}")
    assert res_invalid.status_code == 400, f"Expected 400 for wrong OTP, got {res_invalid.status_code}"

    # 5. Test Valid OTP Verification
    print("\n[TEST 4] Testing Valid OTP Verification...")
    res_valid = client.post("/api/auth/register/verify-otp", json={
        "email": test_email,
        "otp_code": actual_otp
    })
    print(f"Status: {res_valid.status_code}, User Name: {res_valid.json().get('user', {}).get('name')}")
    assert res_valid.status_code == 200, f"Expected 200 for valid OTP, got {res_valid.status_code}: {res_valid.text}"
    token_data = res_valid.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == test_email
    assert token_data["user"]["is_verified"] is True
    assert token_data["user"]["is_guest"] is False

    auth_token = token_data["access_token"]

    # 6. Test Logging in with verified account
    print("\n[TEST 5] Testing Login with verified account...")
    res_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    print(f"Status: {res_login.status_code}, Token received: {'access_token' in res_login.json()}")
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    # 7. Test Duplicate Registration Prevention
    print("\n[TEST 6] Testing Duplicate Registration Prevention...")
    res_dup = client.post("/api/auth/register/send-otp", json={
        "name": "Duplicate User",
        "email": test_email,
        "password": "AnotherPassword123!"
    })
    print(f"Status: {res_dup.status_code}, Detail: {res_dup.json().get('detail')}")
    assert res_dup.status_code == 400

    # 8. Test Authenticated /auth/me
    print("\n[TEST 7] Testing /auth/me with Bearer token...")
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    print(f"Status: {res_me.status_code}, Me Name: {res_me.json().get('name')}")
    assert res_me.status_code == 200
    assert res_me.json()["email"] == test_email

    # 9. Test Guest Login
    print("\n[TEST 8] Testing Guest Login...")
    res_guest = client.post("/api/auth/guest-login")
    print(f"Status: {res_guest.status_code}, Guest User: {res_guest.json().get('user', {}).get('name')}")
    assert res_guest.status_code == 200
    guest_data = res_guest.json()
    assert guest_data["user"]["is_guest"] is True
    guest_token = guest_data["access_token"]

    # 10. Test Guest Playlists Access
    print("\n[TEST 9] Testing Guest access to initial starter playlists...")
    res_guest_pl = client.get("/api/playlists", headers={"Authorization": f"Bearer {guest_token}"})
    print(f"Status: {res_guest_pl.status_code}, Playlist count: {len(res_guest_pl.json())}")
    assert res_guest_pl.status_code == 200
    assert len(res_guest_pl.json()) >= 1, "Guest should have starter playlist seeded!"

    print("\n" + "="*60)
    print("ALL AUTH & GUEST MODE TESTS PASSED SUCCESSFULLY! (10/10)")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_full_auth_flow()

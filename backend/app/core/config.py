from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Playnex - YouTube Playlist Learning & Progress Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-for-playlist-manager-production-grade")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days

    # Default to SQLite, easily switched to MySQL or PostgreSQL with env var
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./playlist_manager.db")
    
    # Optional YouTube Data API v3 key (application has robust fallback scraper)
    YOUTUBE_API_KEY: Optional[str] = os.getenv("YOUTUBE_API_KEY", None)

    # Email SMTP Delivery Configuration (Optional)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")
    SMTP_SSL: bool = os.getenv("SMTP_SSL", "False").lower() in ("true", "1", "yes")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@playnex.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "Playnex Platform")

    # Allowed CORS Origins (can be comma-separated list in env var CORS_ORIGINS)
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:4173"
        ).split(",")
        if origin.strip()
    ]

    class Config:
        case_sensitive = True
        extra = "ignore"
        env_file = ".env"

settings = Settings()



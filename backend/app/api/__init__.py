from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.playlists import router as playlists_router
from app.api.videos import router as videos_router
from app.api.progress import router as progress_router
from app.api.notes import router as notes_router
from app.api.doubts import router as doubts_router
from app.api.tags import router as tags_router
from app.api.revisions import router as revisions_router
from app.api.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(playlists_router)
api_router.include_router(videos_router)
api_router.include_router(progress_router)
api_router.include_router(notes_router)
api_router.include_router(doubts_router)
api_router.include_router(tags_router)
api_router.include_router(revisions_router)
api_router.include_router(analytics_router)

__all__ = ["api_router"]

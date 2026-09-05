from app.schemas.auth import UserRegister, UserLogin, UserOut, Token, TokenPayload
from app.schemas.playlist import PlaylistImport, PlaylistCreate, PlaylistUpdate, PlaylistSummaryOut, PlaylistDetailOut
from app.schemas.video import VideoBase, VideoCreate, VideoOut, VideoDetailOut
from app.schemas.progress import ProgressUpdate, ProgressOut
from app.schemas.tag import TagBase, TagCreate, TagOut, VideoTagAssign
from app.schemas.note import NoteBase, NoteCreate, NoteUpdate, NoteOut, NoteWithVideoOut
from app.schemas.doubt import DoubtBase, DoubtCreate, DoubtUpdate, DoubtOut, DoubtWithVideoOut
from app.schemas.revision import RevisionBase, RevisionCreate, RevisionUpdate, RevisionOut, RevisionWithVideoOut
from app.schemas.analytics import GlobalDashboardStats, RecentActivity

__all__ = [
    "UserRegister", "UserLogin", "UserOut", "Token", "TokenPayload",
    "PlaylistImport", "PlaylistCreate", "PlaylistUpdate", "PlaylistSummaryOut", "PlaylistDetailOut",
    "VideoBase", "VideoCreate", "VideoOut", "VideoDetailOut",
    "ProgressUpdate", "ProgressOut",
    "TagBase", "TagCreate", "TagOut", "VideoTagAssign",
    "NoteBase", "NoteCreate", "NoteUpdate", "NoteOut", "NoteWithVideoOut",
    "DoubtBase", "DoubtCreate", "DoubtUpdate", "DoubtOut", "DoubtWithVideoOut",
    "RevisionBase", "RevisionCreate", "RevisionUpdate", "RevisionOut", "RevisionWithVideoOut",
    "GlobalDashboardStats", "RecentActivity"
]

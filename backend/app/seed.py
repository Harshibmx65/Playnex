import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, Base, engine
from app.models import User, Playlist, Video, UserVideoProgress, Tag, VideoTag, Note, Doubt, Revision
from app.core.security import get_password_hash

def seed_database():
    print("Initializing Database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Creating Demo User: demo@learner.com / password123")
        user = User(
            name="Alex Morgan",
            email="demo@learner.com",
            password_hash=get_password_hash("password123"),
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        db.add(user)
        db.flush()

        print("Creating Standard Tags...")
        tags_data = [
            ("Important", "rose"),
            ("Revise", "amber"),
            ("Interview", "purple"),
            ("Difficult", "rose"),
            ("DSA", "sky"),
            ("Backend", "emerald"),
            ("Must Remember", "indigo"),
            ("Architecture", "purple")
        ]
        tag_objs = {}
        for name, color in tags_data:
            t = Tag(user_id=user.id, name=name, color=color)
            db.add(t)
            db.flush()
            tag_objs[name] = t

        # Playlist 1: Python FastAPI Complete Course
        print("Seeding Playlist 1: Python FastAPI Course...")
        pl1 = Playlist(
            user_id=user.id,
            youtube_playlist_id="PL-osiE80TeTs4UjLw5MM6OjgkjFeUxCYH",
            title="Python FastAPI & Modern Backend Architecture",
            description="Master modern async Python backends, Pydantic validation, dependency injection, and production deployments.",
            thumbnail="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
            channel_name="Tiangolo & Tech Tutorials",
            video_count=6,
            created_at=datetime.now(timezone.utc) - timedelta(days=12),
            updated_at=datetime.now(timezone.utc) - timedelta(minutes=15)
        )
        db.add(pl1)
        db.flush()

        pl1_videos_info = [
            ("Introduction to FastAPI & Async Python", "0sOvCWFmrtA", "14:20", 860, "Getting started with FastAPI, setup, and why async IO provides incredible throughput.\n\nTimestamps:\n00:00 - Introduction & Course Overview\n01:30 - What is FastAPI & Why Async IO?\n04:15 - Virtual Environment & Uvicorn Setup\n08:20 - Declaring First @app.get('/') Root Route\n11:45 - Automatic Interactive Swagger & Redoc\n13:10 - Summary & Next Steps"),
            ("Path Parameters & Query Validation", "SORiTsvnU28", "22:45", 1365, "Declaring clean path parameters, query parameters, types, and string constraints.\n\nChapters:\n00:00 - Introduction to Path Parameters\n02:40 - Adding Type Hints & Automatic Conversion\n06:15 - Query Parameters & Default Values\n12:30 - String Validation with Query(min_length, max_length)\n18:45 - Summary & Parameter Best Practices"),
            ("Pydantic v2 Models & Data Parsing", "GN6ICac3OXY", "31:10", 1870, "Deep dive into Pydantic models, custom validators, nested schemas, and computed fields.\n\nTopics:\n00:00 - Introduction to Pydantic v2\n03:15 - Defining BaseModel with Required & Optional Fields\n09:40 - Field Validation with @field_validator\n16:20 - Nested Schemas & Relationships\n25:10 - Model Serialization to JSON"),
            ("Dependency Injection in FastAPI Explained", "7t2alSnE2zo", "28:50", 1730, "The power of Depends() for auth, database sessions, and hierarchical dependency trees."),
            ("Authentication with OAuth2 & JWT Tokens", "3vUPJA3l12M", "42:15", 2535, "Implementing secure JWT access tokens, password hashing with bcrypt, and protected endpoints.\n\nTimestamps:\n00:00 - Auth Architecture & Security Principles\n05:10 - Password Hashing with Passlib & Bcrypt\n14:30 - Generating JWT Tokens with Expiration\n26:00 - Creating get_current_user Dependency\n38:45 - Testing Protected Endpoints in Swagger"),
            ("SQLAlchemy 2.0 Async Integration & Migrations", "pkYVOmU3MgA", "36:00", 2160, "Connecting async database engines, session makers, relationships, and Alembic migrations.")
        ]

        pl1_videos = []
        for idx, (v_title, y_id, dur_str, dur_secs, desc) in enumerate(pl1_videos_info):
            v = Video(
                playlist_id=pl1.id,
                youtube_video_id=y_id,
                title=v_title,
                thumbnail=f"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
                duration=dur_str,
                duration_seconds=dur_secs,
                position=idx + 1,
                description=desc
            )
            db.add(v)
            db.flush()
            pl1_videos.append(v)

        # Video 1: Completed
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl1_videos[0].id,
            status="COMPLETED",
            watch_percentage=100.0,
            last_position=860.0,
            completed_at=datetime.now(timezone.utc) - timedelta(days=5),
            updated_at=datetime.now(timezone.utc) - timedelta(days=5)
        ))
        db.add(VideoTag(video_id=pl1_videos[0].id, tag_id=tag_objs["Backend"].id))

        # Video 2: Completed
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl1_videos[1].id,
            status="COMPLETED",
            watch_percentage=100.0,
            last_position=1365.0,
            completed_at=datetime.now(timezone.utc) - timedelta(days=3),
            updated_at=datetime.now(timezone.utc) - timedelta(days=3)
        ))
        db.add(VideoTag(video_id=pl1_videos[1].id, tag_id=tag_objs["Backend"].id))
        db.add(Note(
            user_id=user.id,
            video_id=pl1_videos[1].id,
            timestamp=345.0,
            timestamp_formatted="05:45",
            title="Query Parameter Defaults",
            content="Use `Query(default=None, min_length=3)` to enforce parameter constraints without writing manual if checks."
        ))

        # Video 3: Completed with doubts and revision
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl1_videos[2].id,
            status="COMPLETED",
            watch_percentage=100.0,
            last_position=1870.0,
            completed_at=datetime.now(timezone.utc) - timedelta(days=1),
            updated_at=datetime.now(timezone.utc) - timedelta(days=1)
        ))
        db.add(VideoTag(video_id=pl1_videos[2].id, tag_id=tag_objs["Important"].id))
        db.add(VideoTag(video_id=pl1_videos[2].id, tag_id=tag_objs["Revise"].id))
        db.add(Revision(
            user_id=user.id,
            video_id=pl1_videos[2].id,
            status="NEED_REVISION",
            priority="HIGH",
            notes="Need to review Pydantic v2 `field_validator` vs `model_validator` mode='before'."
        ))
        db.add(Note(
            user_id=user.id,
            video_id=pl1_videos[2].id,
            timestamp=720.0,
            timestamp_formatted="12:00",
            title="Pydantic from_attributes",
            content="In Pydantic v2, `orm_mode = True` is replaced by `model_config = ConfigDict(from_attributes=True)`."
        ))

        # Video 4: In Progress (Active)
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl1_videos[3].id,
            status="IN_PROGRESS",
            watch_percentage=65.0,
            last_position=763.0,
            updated_at=datetime.now(timezone.utc) - timedelta(minutes=15)
        ))
        db.add(VideoTag(video_id=pl1_videos[3].id, tag_id=tag_objs["Important"].id))
        db.add(VideoTag(video_id=pl1_videos[3].id, tag_id=tag_objs["Interview"].id))
        db.add(Doubt(
            user_id=user.id,
            video_id=pl1_videos[3].id,
            timestamp=763.0,
            timestamp_formatted="12:43",
            title="Why is Depends() required instead of standard function call?",
            description="When declaring DB session `db: Session = Depends(get_db)`, how does FastAPI handle the generator cleanup upon request completion?",
            status="OPEN"
        ))
        db.add(Revision(
            user_id=user.id,
            video_id=pl1_videos[3].id,
            status="NEED_REVISION",
            priority="HIGH",
            notes="Very common senior interview question on hierarchical dependency injection."
        ))
        db.add(Note(
            user_id=user.id,
            video_id=pl1_videos[3].id,
            timestamp=510.0,
            timestamp_formatted="08:30",
            title="Sub-dependencies caching",
            content="FastAPI caches the result of a dependency call within the scope of a single request unless `use_cache=False` is set."
        ))

        # Video 5: Not started with tags
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl1_videos[4].id,
            status="NOT_STARTED",
            watch_percentage=0.0,
            last_position=0.0
        ))
        db.add(VideoTag(video_id=pl1_videos[4].id, tag_id=tag_objs["Must Remember"].id))
        db.add(VideoTag(video_id=pl1_videos[4].id, tag_id=tag_objs["Interview"].id))

        # Playlist 2: Full-Stack React & Next.js Mastery
        print("Seeding Playlist 2: React 19 Mastery...")
        pl2 = Playlist(
            user_id=user.id,
            youtube_playlist_id="PLillGF-RfqbZ2ybcoD2OamnhGq3zsQnhP",
            title="React 19 & Next.js Architecture Bootcamp",
            description="Comprehensive guide to React Server Components, Actions, State Management, and Tailwind CSS.",
            thumbnail="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
            channel_name="Traversy & Frontend Masters",
            video_count=4,
            created_at=datetime.now(timezone.utc) - timedelta(days=8),
            updated_at=datetime.now(timezone.utc) - timedelta(hours=6)
        )
        db.add(pl2)
        db.flush()

        pl2_videos_info = [
            ("React 19 Core Fundamentals & Server Components", "w7ejDZ8SWv8", "25:30", 1530, "Understanding the shift to React Server Components and boundary serialization."),
            ("useActionState & useOptimistic in Depth", "843nec-IvW0", "34:15", 2055, "New React 19 hooks for handling form states, optimistic UI updates without extra libraries."),
            ("Server Actions & Progressive Enhancement", "d5x0JCb2eHQ", "40:00", 2400, "Secure server-side mutations directly from forms with automatic revalidation."),
            ("Building a Production Dark Mode Design System", "bMknfKXIFA8", "28:10", 1690, "Creating sleek glassy modern themes with Tailwind CSS and CSS variables.")
        ]

        pl2_videos = []
        for idx, (v_title, y_id, dur_str, dur_secs, desc) in enumerate(pl2_videos_info):
            v = Video(
                playlist_id=pl2.id,
                youtube_video_id=y_id,
                title=v_title,
                thumbnail="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
                duration=dur_str,
                duration_seconds=dur_secs,
                position=idx + 1,
                description=desc
            )
            db.add(v)
            db.flush()
            pl2_videos.append(v)

        # Video 1: Completed
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl2_videos[0].id,
            status="COMPLETED",
            watch_percentage=100.0,
            last_position=1530.0,
            completed_at=datetime.now(timezone.utc) - timedelta(days=2),
            updated_at=datetime.now(timezone.utc) - timedelta(days=2)
        ))
        db.add(Doubt(
            user_id=user.id,
            video_id=pl2_videos[0].id,
            timestamp=620.0,
            timestamp_formatted="10:20",
            title="Can Server Components use useState?",
            description="Why doesn't useState work in RSC?",
            status="RESOLVED",
            resolution_notes="Server components execute only on the server at build/request time and don't maintain client lifecycle state. Use 'use client' for state.",
            resolved_at=datetime.now(timezone.utc) - timedelta(days=1)
        ))

        # Video 2: In progress
        db.add(UserVideoProgress(
            user_id=user.id,
            video_id=pl2_videos[1].id,
            status="IN_PROGRESS",
            watch_percentage=45.0,
            last_position=924.0,
            updated_at=datetime.now(timezone.utc) - timedelta(hours=6)
        ))
        db.add(Revision(
            user_id=user.id,
            video_id=pl2_videos[1].id,
            status="NEED_REVISION",
            priority="MEDIUM",
            notes="Practice writing an optimistic like button with useOptimistic."
        ))

        # Playlist 3: Data Structures & Algorithms Roadmap
        print("Seeding Playlist 3: Data Structures & Algorithms...")
        pl3 = Playlist(
            user_id=user.id,
            youtube_playlist_id="PL9gnSGHSqcnr_XifFG8sfA97wbiK79mpx",
            title="DSA & Algorithmic Problem Solving",
            description="Core algorithms, dynamic programming patterns, graphs, and system design foundations.",
            thumbnail="https://images.unsplash.com/photo-1516116211227-bbc13c733359?w=800&auto=format&fit=crop&q=80",
            channel_name="Kunal Kushwaha & CS50",
            video_count=3,
            created_at=datetime.now(timezone.utc) - timedelta(days=20),
            updated_at=datetime.now(timezone.utc) - timedelta(days=4)
        )
        db.add(pl3)
        db.flush()

        pl3_videos_info = [
            ("Binary Search in 2D Matrices & Rotated Arrays", "8hly31xKli0", "38:40", 2320, "Mastering modified binary search patterns for medium/hard interview problems."),
            ("Graph BFS & DFS with Cycle Detection", "KLlXCFG5TnA", "45:10", 2710, "Topological sort, Kahn's algorithm, and bipartite graph verification."),
            ("Dynamic Programming: 0/1 Knapsack & Subset Sum", "0sOvCWFmrtA", "52:00", 3120, "Tabulation vs memoization strategies and space optimization.")
        ]

        for idx, (v_title, y_id, dur_str, dur_secs, desc) in enumerate(pl3_videos_info):
            v = Video(
                playlist_id=pl3.id,
                youtube_video_id=y_id,
                title=v_title,
                thumbnail="https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
                duration=dur_str,
                duration_seconds=dur_secs,
                position=idx + 1,
                description=desc
            )
            db.add(v)
            db.flush()
            db.add(VideoTag(video_id=v.id, tag_id=tag_objs["DSA"].id))
            db.add(VideoTag(video_id=v.id, tag_id=tag_objs["Interview"].id))
            if idx == 0:
                db.add(UserVideoProgress(
                    user_id=user.id,
                    video_id=v.id,
                    status="COMPLETED",
                    watch_percentage=100.0,
                    last_position=2320.0,
                    completed_at=datetime.now(timezone.utc) - timedelta(days=4),
                    updated_at=datetime.now(timezone.utc) - timedelta(days=4)
                ))
                db.add(Revision(
                    user_id=user.id,
                    video_id=v.id,
                    status="NEED_REVISION",
                    priority="HIGH",
                    notes="Practice Rotated Sorted Array search edge cases (duplicates)."
                ))
            elif idx == 1:
                db.add(Doubt(
                    user_id=user.id,
                    video_id=v.id,
                    timestamp=1140.0,
                    timestamp_formatted="19:00",
                    title="Detecting cycles in directed vs undirected graphs",
                    description="Why do we need a recursion stack array for directed graph cycle detection with DFS?",
                    status="OPEN"
                ))

        db.commit()
        print("Database seeded successfully with rich realistic data!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

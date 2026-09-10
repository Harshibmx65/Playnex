from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Check for missing columns in users table for SQLite/relational DBs
    try:
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1;"))
                conn.commit()
            except Exception:
                pass  # Column already exists
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT 0;"))
                conn.commit()
            except Exception:
                pass  # Column already exists
    except Exception as e:
        # Avoid crashing startup if DB connection or dialect doesn't support raw ALTER
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


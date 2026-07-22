import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load the .env file
load_dotenv()

def _normalize_database_url(url: str | None) -> str | None:
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL"))
Base = declarative_base()

# Keep Base importable even when DATABASE_URL is missing (e.g. during migration bootstrapping).
if DATABASE_URL:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
else:
    engine = None
    SessionLocal = None



def get_db():
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL environment variable is required and must be set in Render Environment")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

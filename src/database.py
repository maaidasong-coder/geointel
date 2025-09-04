# src/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env (local dev only)
load_dotenv()

# Prefer DATABASE_URL from environment (Render sets this automatically)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    # Fallback to SQLite for local testing
    DATABASE_URL = "sqlite:///./test.db"

# Needed for SQLite (check_same_thread=False)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

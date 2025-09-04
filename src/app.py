# src/app.py

from fastapi import FastAPI, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
from dotenv import load_dotenv

# ==============================
# Load environment variables
# ==============================

# This will load variables from a local .env file (if present).
# On Render, .env is not needed because DATABASE_URL is injected automatically.
load_dotenv()

# ==============================
# Database setup
# ==============================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/geointel")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for DB sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================
# FastAPI app
# ==============================

app = FastAPI(title="GeoIntel API", version="0.1")

@app.get("/")
def read_root():
    return {"message": "🚀 GeoIntel backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Example endpoint using DB
@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")  # simple query
        return {"database": "connected"}
    except Exception as e:
        return {"database": f"error: {str(e)}"}

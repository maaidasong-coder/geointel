# src/app.py

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db

# ==============================
# Database initialization
# ==============================

# Ensure tables are created (only for simple projects).
# In production, prefer migrations with Alembic.
models.Base.metadata.create_all(bind=engine)

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

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    """Simple endpoint to verify DB connectivity."""
    try:
        db.execute("SELECT 1")
        return {"database": "connected"}
    except Exception as e:
        return {"database": f"error: {str(e)}"}

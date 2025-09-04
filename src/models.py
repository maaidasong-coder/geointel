# src/models.py

from sqlalchemy import Column, Integer, String, DateTime, func
from .database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    location = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Incident(id={self.id}, title={self.title}, location={self.location})>"

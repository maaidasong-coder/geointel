# src/routes/incidents.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database

router = APIRouter(prefix="/incidents", tags=["incidents"])

# Dependency
get_db = database.get_db


# Create an incident
@router.post("/", response_model=dict)
def create_incident(title: str, location: str, db: Session = Depends(get_db)):
    incident = models.Incident(title=title, location=location)
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return {"id": incident.id, "title": incident.title, "location": incident.location}


# List all incidents
@router.get("/", response_model=list)
def list_incidents(db: Session = Depends(get_db)):
    incidents = db.query(models.Incident).all()
    return [{"id": i.id, "title": i.title, "location": i.location, "created_at": i.created_at} for i in incidents]


# Get single incident by ID
@router.get("/{incident_id}", response_model=dict)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"id": incident.id, "title": incident.title, "location": incident.location, "created_at": incident.created_at}

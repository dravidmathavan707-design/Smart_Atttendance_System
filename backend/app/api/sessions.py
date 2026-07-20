from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.models import Session as ClassSession, Teacher
from app.schemas.schemas import SessionStart, SessionOut
from app.auth.dependencies import get_current_teacher

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionOut)
def start_session(
    payload: SessionStart,
    db: DBSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    """
    Teacher starts a period. GPS is captured ONCE here and never updated again —
    this prevents inconsistent radius checks if the teacher walks around mid-session.
    """
    session = ClassSession(
        teacher_id=current_teacher.id,
        department_id=payload.department_id,
        subject=payload.subject,
        teacher_lat=payload.teacher_lat,
        teacher_lng=payload.teacher_lng,
        radius_meters=payload.radius_meters,
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/close")
def close_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.status = "closed"
    session.end_time = datetime.utcnow()
    db.commit()
    return {"message": "Session closed"}


@router.get("/active/{department_id}", response_model=list[SessionOut])
def get_active_sessions(department_id: int, db: DBSession = Depends(get_db)):
    return (
        db.query(ClassSession)
        .filter(ClassSession.department_id == department_id, ClassSession.status == "active")
        .all()
    )

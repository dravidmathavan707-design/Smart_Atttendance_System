from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session as DBSession
from jose import JWTError

from app.database import get_db
from app.models.models import Student, Teacher, ControlUser
from app.auth.security import decode_access_token

# Registering this as a proper FastAPI security scheme is what makes the
# 🔒 Authorize button appear in Swagger UI (/docs) — a plain Header() parameter
# does NOT do this, it only shows a manual per-endpoint text box that's easy
# to fill in wrong or skip entirely. Click Authorize once, paste just the raw
# token (no "Bearer " prefix needed — Swagger adds that automatically).
bearer_scheme = HTTPBearer(
    scheme_name="BearerAuth",
    description="Paste the access_token from /auth/*/login here (no 'Bearer ' prefix needed).",
)


def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        return decode_access_token(token)
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


def get_current_student(
    payload: dict = Depends(get_token_payload), db: DBSession = Depends(get_db)
) -> Student:
    if payload.get("type") != "student":
        raise HTTPException(403, "Student token required")
    student = db.query(Student).filter(Student.id == int(payload["sub"])).first()
    if not student or not student.is_active:
        raise HTTPException(401, "Student not found or inactive")
    return student


def get_current_teacher(
    payload: dict = Depends(get_token_payload), db: DBSession = Depends(get_db)
) -> Teacher:
    if payload.get("type") != "teacher":
        raise HTTPException(403, "Teacher token required")
    teacher = db.query(Teacher).filter(Teacher.id == int(payload["sub"])).first()
    if not teacher:
        raise HTTPException(401, "Teacher not found")
    return teacher


def get_current_control_user(
    payload: dict = Depends(get_token_payload), db: DBSession = Depends(get_db)
) -> ControlUser:
    if payload.get("type") != "control_user":
        raise HTTPException(403, "Admin/HOD/Staff token required")
    user = db.query(ControlUser).filter(ControlUser.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(401, "Account not found or inactive")
    return user


def require_role(*allowed_roles: str):
    """
    Usage: Depends(require_role("master", "admin"))
    Blocks the request unless the control_user's role is in allowed_roles.
    """
    def checker(user: ControlUser = Depends(get_current_control_user)) -> ControlUser:
        if user.role.name == "super_master" or user.role.name in allowed_roles:
            return user
        raise HTTPException(403, f"Requires one of roles: {', '.join(allowed_roles)}")
    return checker
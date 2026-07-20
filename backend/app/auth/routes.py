from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.models import Student, Teacher, ControlUser, StudentDevice, Alert, StudentCredential
from app.auth.security import (
    verify_password,
    create_access_token,
    verify_device_proof,
    create_device_proof,
)
from app.schemas.schemas import TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


class StudentLoginRequest(BaseModel):
    institution_id: int
    email: EmailStr
    device_token: str
    device_proof: str


class PasswordLoginRequest(BaseModel):
    institution_id: int
    email: EmailStr
    password: str


@router.post("/student/login", response_model=TokenResponse)
def student_login(payload: StudentLoginRequest, request: Request, db: DBSession = Depends(get_db)):
    """
    Students never use a password day-to-day — the bound device IS the credential.
    If the device token doesn't match what's on file, this is treated as a
    'new device' event: reject here, and the frontend should route the student
    back through OTP re-verification (see otp/routes.py) instead of logging in directly.
    """
    student = (
        db.query(Student)
        .filter(
            Student.institution_id == payload.institution_id,
            Student.email == payload.email,
        )
        .first()
    )
    if not student or not student.phone_verified:
        raise HTTPException(404, "Student not found or not yet verified")

    token_owner = (
        db.query(StudentDevice)
        .filter(StudentDevice.device_token == payload.device_token)
        .first()
    )
    if token_owner and token_owner.student_id != student.id:
        db.add(
            Alert(
                session_id=None,
                student_id=student.id,
                alert_type="device_reuse_attempt",
                message="Student login attempted with a device linked to another student",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "This device is already linked to another student account")

    device = (
        db.query(StudentDevice)
        .filter(StudentDevice.student_id == student.id, StudentDevice.is_primary == True)  # noqa: E712
        .first()
    )
    if not device or device.device_token != payload.device_token:
        db.add(
            Alert(
                session_id=None,
                student_id=student.id,
                alert_type="new_device_attempt",
                message="Student login rejected due to unrecognized device token",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "New or unrecognized device — OTP re-verification required")

    ua = request.headers.get("user-agent", "")
    if not verify_device_proof(payload.device_proof, student.id, payload.device_token, ua):
        db.add(
            Alert(
                session_id=None,
                student_id=student.id,
                alert_type="device_proof_failed",
                message="Student login rejected due to invalid device proof",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "Device verification failed — OTP re-verification required")

    token = create_access_token({"sub": str(student.id), "type": "student"})
    refreshed_device_proof = create_device_proof(student.id, payload.device_token, ua)
    return TokenResponse(access_token=token, device_proof=refreshed_device_proof)


@router.post("/student/password-login", response_model=TokenResponse)
def student_password_login(payload: PasswordLoginRequest, db: DBSession = Depends(get_db)):
    student = (
        db.query(Student)
        .filter(
            Student.institution_id == payload.institution_id,
            Student.email == payload.email,
            Student.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not student or not student.phone_verified:
        raise HTTPException(401, "Student is not verified for login")

    credential = db.query(StudentCredential).filter(StudentCredential.student_id == student.id).first()
    if not credential or not verify_password(payload.password, credential.password_hash):
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token({"sub": str(student.id), "type": "student"})
    return TokenResponse(access_token=token)


@router.post("/teacher/login", response_model=TokenResponse)
def teacher_login(payload: PasswordLoginRequest, db: DBSession = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == payload.email).first()
    if not teacher or not verify_password(payload.password, teacher.password_hash):
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token({"sub": str(teacher.id), "type": "teacher"})
    return TokenResponse(access_token=token)


@router.post("/staff/login", response_model=TokenResponse)
def control_user_login(payload: PasswordLoginRequest, db: DBSession = Depends(get_db)):
    """
    Covers Master, Admin, HOD, and Staff — role is embedded in the JWT via the
    ControlUser's role_id, checked later by require_role() on protected endpoints.
    """
    user = (
        db.query(ControlUser)
        .filter(ControlUser.email == payload.email)
        .first()
    )
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")

    if user.role.name != "super_master" and user.institution_id != payload.institution_id:
        raise HTTPException(401, "Incorrect email or password")

    token = create_access_token({"sub": str(user.id), "type": "control_user", "role": user.role.name})
    return TokenResponse(access_token=token)

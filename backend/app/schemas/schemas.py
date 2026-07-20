from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ---------- Auth / OTP ----------
class StudentInviteCreate(BaseModel):
    email: EmailStr
    phone: str
    department_id: int
    student_code: str
    name: str


class OtpVerifyRequest(BaseModel):
    invite_token: str
    otp_code: str
    device_token: str  # UUID generated client-side


class LoginRequest(BaseModel):
    institution_id: int
    email: EmailStr
    password: str
    device_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    device_proof: Optional[str] = None


# ---------- Sessions ----------
class SessionStart(BaseModel):
    department_id: int
    subject: str
    teacher_lat: float
    teacher_lng: float
    radius_meters: int = 40


class SessionOut(BaseModel):
    id: int
    subject: str
    status: str
    start_time: datetime

    class Config:
        from_attributes = True


# ---------- Attendance ----------
class AttendanceMark(BaseModel):
    session_id: int
    student_lat: float
    student_lng: float
    device_token: str
    device_proof: Optional[str] = None


class AttendanceResult(BaseModel):
    status: str  # present | flagged
    distance_meters: float
    message: str


class DashboardEntry(BaseModel):
    reg_no: str
    name: str


class LockRemovedEntry(BaseModel):
    reg_no: str
    name: str
    reason: str
    timestamp: datetime


class SessionDashboard(BaseModel):
    present: list[DashboardEntry]
    absent: list[DashboardEntry]
    lock_removed: list[LockRemovedEntry]
    counts: dict

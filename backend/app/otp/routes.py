import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.models import Student, StudentInvite, OtpRequest, StudentDevice, ControlUser, Alert, ControlUserDepartment
from app.schemas.schemas import StudentInviteCreate, OtpVerifyRequest
from app.auth.security import (
    generate_otp,
    otp_expiry_time,
    send_otp_sms,
    OTP_MAX_ATTEMPTS,
    create_device_proof,
)
from app.auth.dependencies import get_current_control_user
from app.services.audit import log_action

router = APIRouter(prefix="/otp", tags=["otp"])


def _get_allowed_department_ids(db: DBSession, user: ControlUser) -> set[int]:
    dept_ids = {
        row.department_id
        for row in db.query(ControlUserDepartment).filter(ControlUserDepartment.control_user_id == user.id).all()
    }
    if user.department_id:
        dept_ids.add(user.department_id)
    return dept_ids


@router.post("/invite")
def invite_student(
    payload: StudentInviteCreate,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(get_current_control_user),
):
    """
    Step 1: HOD/Staff invites a student by email + phone.
    (invited_by / control_user auth is enforced by permissions middleware — omitted here for brevity)
    """
    if current_user.role.name not in {"hod", "staff"}:
        raise HTTPException(403, "Only HOD and Staff can invite students")

    allowed_department_ids = _get_allowed_department_ids(db, current_user)
    if not allowed_department_ids:
        raise HTTPException(403, "Inviter must be assigned to a department")

    if payload.department_id not in allowed_department_ids:
        raise HTTPException(403, "You can invite students only for your own department")

    existing = db.query(Student).filter(Student.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Student already registered")

    invite_token = str(uuid.uuid4())
    invite = StudentInvite(
        email=payload.email,
        phone=payload.phone,
        department_id=payload.department_id,
        invited_by=current_user.id,
        invite_token=invite_token,
        expires_at=otp_expiry_time(),  # reuse helper, but with a longer window in production (24-48h)
    )
    db.add(invite)
    db.flush()

    log_action(
        db,
        actor_id=current_user.id,
        action="invite_student",
        target_type="student_invite",
        target_id=invite.id,
        details=f"Invited {payload.email} for department_id={payload.department_id}",
    )
    db.commit()

    # In production: send invite_token via email service, not returned in API response
    return {"message": "Invite sent", "invite_token": invite_token}


@router.post("/request-otp/{invite_token}")
def request_otp(invite_token: str, db: DBSession = Depends(get_db)):
    """
    Step 2: student opens invite link, requests OTP to registered phone.
    """
    invite = db.query(StudentInvite).filter(StudentInvite.invite_token == invite_token).first()
    if not invite or invite.status != "pending":
        raise HTTPException(404, "Invalid or expired invite")
    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(400, "Invite expired")

    otp_code = generate_otp()

    # student record is created here in 'pending verification' state if not already present
    student = db.query(Student).filter(Student.email == invite.email).first()
    if not student:
        student = Student(
            student_code=f"TEMP-{uuid.uuid4().hex[:6]}",
            name="Pending",
            email=invite.email,
            phone=invite.phone,
            department_id=invite.department_id,
            phone_verified=False,
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    otp = OtpRequest(
        student_id=student.id,
        otp_code=otp_code,
        purpose="registration",
        expires_at=otp_expiry_time(),
    )
    db.add(otp)
    db.commit()

    send_otp_sms(invite.phone, otp_code)
    return {"message": "OTP sent", "student_id": student.id}


@router.post("/verify")
def verify_otp(payload: OtpVerifyRequest, request: Request, db: DBSession = Depends(get_db)):
    """
    Step 3: verify OTP, bind device token, activate account.
    Order matters: phone verified FIRST, device bound AFTER — see design notes.
    """
    invite = db.query(StudentInvite).filter(StudentInvite.invite_token == payload.invite_token).first()
    if not invite:
        raise HTTPException(404, "Invalid invite")

    student = db.query(Student).filter(Student.email == invite.email).first()
    if not student:
        raise HTTPException(404, "Student record not found — request OTP first")

    otp_row = (
        db.query(OtpRequest)
        .filter(OtpRequest.student_id == student.id, OtpRequest.verified == False)  # noqa: E712
        .order_by(OtpRequest.created_at.desc())
        .first()
    )
    if not otp_row:
        raise HTTPException(400, "No active OTP found — request a new one")
    if otp_row.expires_at < datetime.utcnow():
        raise HTTPException(400, "OTP expired")
    if otp_row.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(429, "Too many failed attempts — request a new OTP")

    if otp_row.otp_code != payload.otp_code:
        otp_row.attempts += 1
        db.commit()
        raise HTTPException(400, f"Incorrect OTP ({otp_row.attempts}/{OTP_MAX_ATTEMPTS} attempts)")

    existing_token_owner = (
        db.query(StudentDevice)
        .filter(StudentDevice.device_token == payload.device_token)
        .first()
    )
    if existing_token_owner and existing_token_owner.student_id != student.id:
        db.add(
            Alert(
                session_id=None,
                student_id=student.id,
                alert_type="device_reuse_attempt",
                message="OTP verification attempted with a device already linked to another student",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "This device is already linked to another student account")

    existing_primary = (
        db.query(StudentDevice)
        .filter(StudentDevice.student_id == student.id, StudentDevice.is_primary == True)  # noqa: E712
        .first()
    )
    if existing_primary and existing_primary.device_token != payload.device_token:
        db.add(
            Alert(
                session_id=None,
                student_id=student.id,
                alert_type="new_device_attempt",
                message="OTP verification attempted from a new device token",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "New device detected — manual re-verification required")

    # OTP correct
    otp_row.verified = True
    student.phone_verified = True
    invite.status = "accepted"

    if not existing_primary:
        # bind device (MVP: client-generated UUID token, not a native device ID)
        device = StudentDevice(
            student_id=student.id,
            device_token=payload.device_token,
            device_label="primary",
            is_primary=True,
        )
        db.add(device)

    db.commit()

    ua = request.headers.get("user-agent", "")
    device_proof = create_device_proof(
        student_id=student.id,
        device_token=payload.device_token,
        user_agent=ua,
    )

    return {
        "message": "Account activated",
        "student_id": student.id,
        "device_proof": device_proof,
    }

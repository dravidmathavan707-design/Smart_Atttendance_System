from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.models import Session as ClassSession, AttendanceLog, StudentDevice, Student, Alert
from app.schemas.schemas import AttendanceMark, AttendanceResult, SessionDashboard, DashboardEntry, LockRemovedEntry
from app.services.distance import haversine_distance_meters
from app.auth.dependencies import get_current_student
from app.auth.security import verify_device_proof

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/mark", response_model=AttendanceResult)
def mark_attendance(
    payload: AttendanceMark,
    request: Request,
    db: DBSession = Depends(get_db),
    current_student: Student = Depends(get_current_student),
):
    student_id = current_student.id

    session = db.query(ClassSession).filter(ClassSession.id == payload.session_id).first()
    if not session or session.status != "active":
        raise HTTPException(404, "No active session found")

    token_owner = (
        db.query(StudentDevice)
        .filter(StudentDevice.device_token == payload.device_token)
        .first()
    )
    if token_owner and token_owner.student_id != student_id:
        db.add(
            Alert(
                session_id=session.id,
                student_id=student_id,
                alert_type="device_reuse_attempt",
                message="Attendance attempt used a device token linked to another student",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "This device is already linked to another student account")

    # 1. Device token check — must match the student's bound primary device
    device = (
        db.query(StudentDevice)
        .filter(StudentDevice.student_id == student_id, StudentDevice.is_primary == True)  # noqa: E712
        .first()
    )
    if not device or device.device_token != payload.device_token:
        db.add(
            Alert(
                session_id=session.id,
                student_id=student_id,
                alert_type="new_device_attempt",
                message="Attendance rejected due to unrecognized device token",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "Device not recognized — re-verification required")

    ua = request.headers.get("user-agent", "")
    if not payload.device_proof or not verify_device_proof(payload.device_proof, student_id, payload.device_token, ua):
        db.add(
            Alert(
                session_id=session.id,
                student_id=student_id,
                alert_type="device_proof_failed",
                message="Attendance rejected due to invalid or missing device proof",
                resolved=False,
            )
        )
        db.commit()
        raise HTTPException(403, "Device verification failed — OTP re-verification required")

    # 2. Duplicate check — one entry per student per session
    existing = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.session_id == session.id, AttendanceLog.student_id == student_id)
        .first()
    )
    if existing:
        raise HTTPException(400, "Attendance already marked for this session")

    # 3. GPS proximity check (teacher location fixed at session start, never updated)
    distance = haversine_distance_meters(
        float(session.teacher_lat), float(session.teacher_lng),
        payload.student_lat, payload.student_lng,
    )
    status = "present" if distance <= session.radius_meters else "flagged"

    log = AttendanceLog(
        session_id=session.id,
        student_id=student_id,
        student_lat=payload.student_lat,
        student_lng=payload.student_lng,
        distance_meters=round(distance, 2),
        device_token=payload.device_token,
        status=status,
    )
    db.add(log)

    if status == "flagged":
        db.add(
            Alert(
                session_id=session.id,
                student_id=student_id,
                alert_type="outside_radius",
                message=f"Student outside radius at {round(distance, 2)}m",
                resolved=False,
            )
        )

    db.commit()

    message = "Marked present" if status == "present" else "Outside classroom radius — flagged for review"
    return AttendanceResult(status=status, distance_meters=round(distance, 2), message=message)


@router.get("/{session_id}/dashboard", response_model=SessionDashboard)
def session_dashboard(session_id: int, db: DBSession = Depends(get_db)):
    """
    Live present/absent list with register number + name, for the teacher's view.
    """
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    all_students = db.query(Student).filter(Student.department_id == session.department_id).all()
    present_logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.session_id == session_id, AttendanceLog.status == "present")
        .all()
    )
    flagged_logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.session_id == session_id, AttendanceLog.status == "flagged")
        .all()
    )
    present_ids = {log.student_id for log in present_logs}

    present = [
        DashboardEntry(reg_no=s.student_code, name=s.name) for s in all_students if s.id in present_ids
    ]
    absent = [
        DashboardEntry(reg_no=s.student_code, name=s.name) for s in all_students if s.id not in present_ids
    ]

    lock_removed = []
    for log in flagged_logs:
        student = next((s for s in all_students if s.id == log.student_id), None)
        if not student:
            continue
        alert = (
            db.query(Alert)
            .filter(Alert.session_id == session_id, Alert.student_id == log.student_id)
            .order_by(Alert.created_at.desc())
            .first()
        )
        reason = alert.message if alert else "Outside classroom radius"
        lock_removed.append(
            LockRemovedEntry(
                reg_no=student.student_code,
                name=student.name,
                reason=reason,
                timestamp=log.marked_at,
            )
        )

    return SessionDashboard(
        present=present,
        absent=absent,
        lock_removed=lock_removed,
        counts={
            "present": len(present),
            "absent": len(absent),
            "lock_removed": len(lock_removed),
            "total": len(all_students),
        },
    )

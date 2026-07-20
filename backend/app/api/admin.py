from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from app.database import get_db
from app.models.models import (
    ControlUser,
    Role,
    Institution,
    Student,
    Department,
    ControlUserDepartment,
    StudentCredential,
    TimetableEntry,
    Session as ClassSession,
    Alert,
)
from app.schemas.admin_schemas import (
    AppointHodRequest, AppointStaffRequest, AppointAdminRequest, AppointMasterRequest, ControlUserOut,
    CreateInstitutionRequest, InstitutionOut,
    AdminStatsOut,
    ControlUserStatusUpdateRequest,
    InstitutionStatusUpdateRequest,
    DepartmentOut,
    StudentCreateRequest,
    StudentOut,
    TimetableCreateRequest,
    TimetableOut,
    StartSessionFromTimetableRequest,
)
from app.auth.security import hash_password
from app.auth.dependencies import get_current_control_user, require_role
from app.services.audit import log_action

router = APIRouter(prefix="/admin", tags=["admin"])


def _can_manage_control_user(current_user: ControlUser, target_user: ControlUser) -> bool:
    if target_user.id == current_user.id:
        return False

    actor_role = current_user.role.name
    target_role = target_user.role.name

    if target_role == "super_master":
        return False

    if actor_role == "super_master":
        return True

    if current_user.institution_id != target_user.institution_id:
        return False

    allowed_targets = {
        "master": {"admin", "hod", "staff"},
        "admin": {"hod", "staff"},
        "hod": {"staff"},
        "staff": set(),
    }

    if target_role not in allowed_targets.get(actor_role, set()):
        return False

    if actor_role == "hod":
        return current_user.department_id is not None and current_user.department_id == target_user.department_id

    return True


def _get_role_id(db: DBSession, role_name: str) -> int:
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(500, f"Role '{role_name}' not seeded in database — run the role seed script")
    return role.id


def _normalize_department_name(name: str) -> str:
    cleaned = (name or "").strip()
    if not cleaned:
        return ""

    # Keep short alpha department codes in uppercase (e.g., CSE, CCE)
    if cleaned.isalpha() and len(cleaned) <= 6:
        return cleaned.upper()

    return " ".join(part.capitalize() for part in cleaned.split())


def _resolve_department_id(db: DBSession, department_id: int | None, department_name: str | None) -> int:
    if department_id:
        existing = db.query(Department).filter(Department.id == department_id).first()
        if not existing:
            raise HTTPException(404, "Department not found")
        return existing.id

    normalized_name = _normalize_department_name(department_name or "")
    if not normalized_name:
        raise HTTPException(400, "Department is required")

    existing_by_name = (
        db.query(Department)
        .filter(func.lower(Department.name) == normalized_name.lower())
        .first()
    )
    if existing_by_name:
        return existing_by_name.id

    new_department = Department(name=normalized_name)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department.id


def _ensure_dynamic_tables(db: DBSession) -> None:
    bind = db.get_bind()
    StudentCredential.__table__.create(bind=bind, checkfirst=True)
    TimetableEntry.__table__.create(bind=bind, checkfirst=True)
    ControlUserDepartment.__table__.create(bind=bind, checkfirst=True)


def _get_user_department_ids(db: DBSession, user: ControlUser) -> set[int]:
    mapped_ids = {
        row.department_id
        for row in db.query(ControlUserDepartment).filter(ControlUserDepartment.control_user_id == user.id).all()
    }

    if user.department_id:
        mapped_ids.add(user.department_id)

    return mapped_ids


def _can_access_department(db: DBSession, user: ControlUser, department_id: int) -> bool:
    if user.role.name in {"super_master", "master", "admin"}:
        return True

    return department_id in _get_user_department_ids(db, user)


def _resolve_department_ids(
    db: DBSession,
    department_ids: list[int] | None,
    department_names: list[str] | None,
    fallback_department_id: int | None,
    fallback_department_name: str | None,
) -> list[int]:
    resolved_ids: list[int] = []

    for dept_id in department_ids or []:
        resolved = _resolve_department_id(db, dept_id, None)
        if resolved not in resolved_ids:
            resolved_ids.append(resolved)

    for dept_name in department_names or []:
        resolved = _resolve_department_id(db, None, dept_name)
        if resolved not in resolved_ids:
            resolved_ids.append(resolved)

    if not resolved_ids:
        resolved = _resolve_department_id(db, fallback_department_id, fallback_department_name)
        resolved_ids.append(resolved)

    return resolved_ids


def _create_control_user(
    db,
    payload,
    role_name: str,
    department_id,
    current_user,
    institution_id: int | None = None,
    department_ids: list[int] | None = None,
) -> ControlUser:
    existing = db.query(ControlUser).filter(ControlUser.email == payload.email).first()
    if existing:
        raise HTTPException(400, "A control account with this email already exists")

    resolved_institution_id = institution_id if institution_id is not None else current_user.institution_id
    if resolved_institution_id is None:
        raise HTTPException(400, "Institution is required for control-user creation")

    if institution_id is not None:
        institution = db.query(Institution).filter(Institution.id == institution_id).first()
        if not institution:
            raise HTTPException(404, "Institution not found")

    role_id = _get_role_id(db, role_name)
    new_user = ControlUser(
        institution_id=resolved_institution_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role_id=role_id,
        department_id=department_id,
        created_by=current_user.id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    if role_name == "staff":
        assigned_department_ids = list(dict.fromkeys(department_ids or ([department_id] if department_id else [])))
        for dep_id in assigned_department_ids:
            db.add(ControlUserDepartment(control_user_id=new_user.id, department_id=dep_id))

    log_action(
        db,
        actor_id=current_user.id,
        action=f"appoint_{role_name}",
        target_type="control_user",
        target_id=new_user.id,
        details=f"Appointed {payload.email} as {role_name}" + (f" for department_ids={department_ids}" if department_ids else (f" for department_id={department_id}" if department_id else "")),
    )
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/institutions", response_model=InstitutionOut)
def create_institution(
    payload: CreateInstitutionRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "super_master")),
):
    existing = db.query(Institution).filter(Institution.name == payload.name).first()
    if existing:
        raise HTTPException(400, "Institution with this name already exists")

    institution = Institution(
        name=payload.name,
        code=payload.code,
        email_domain=payload.email_domain,
        type=payload.type,
        status=payload.status,
    )
    db.add(institution)
    db.commit()
    db.refresh(institution)

    log_action(
        db,
        actor_id=current_user.id,
        action="create_institution",
        target_type="institution",
        target_id=institution.id,
        details=f"Created institution {institution.name}",
    )
    return InstitutionOut(
        id=institution.id,
        name=institution.name,
        code=institution.code,
        email_domain=institution.email_domain,
        type=institution.type,
        status=institution.status,
    )


@router.post("/appoint-master", response_model=ControlUserOut)
def appoint_master(
    payload: AppointMasterRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master")),
):
    """
    Super Master can create institution masters.
    """
    new_master = _create_control_user(
        db,
        payload,
        "master",
        None,
        current_user,
        institution_id=payload.institution_id,
    )
    return ControlUserOut(id=new_master.id, name=new_master.name, email=new_master.email, role="master", department_id=None)


@router.post("/appoint-admin", response_model=ControlUserOut)
def appoint_admin(
    payload: AppointAdminRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master")),
):
    """
    Only Master Control can create an Admin Control account.
    Admin itself cannot appoint another Admin — matches the design doc's permission table.
    """
    new_admin = _create_control_user(db, payload, "admin", None, current_user)
    return ControlUserOut(id=new_admin.id, name=new_admin.name, email=new_admin.email, role="admin", department_id=None)


@router.post("/appoint-hod", response_model=ControlUserOut)
def appoint_hod(
    payload: AppointHodRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin")),
):
    """
    Only Master Control and Admin Control can appoint an HOD.
    Per the design doc: HOD Admin itself cannot appoint another HOD.
    """
    resolved_department_id = _resolve_department_id(db, payload.department_id, payload.department_name)
    new_hod = _create_control_user(db, payload, "hod", resolved_department_id, current_user)
    return ControlUserOut(id=new_hod.id, name=new_hod.name, email=new_hod.email, role="hod", department_id=new_hod.department_id)


@router.post("/appoint-staff", response_model=ControlUserOut)
def appoint_staff(
    payload: AppointStaffRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod")),
):
    """
    Master, Admin, and HOD can all appoint Staff.
    HOD is restricted to appointing Staff within their OWN department only —
    this is the one place role alone isn't enough, we also check department_id.
    """
    resolved_department_ids = _resolve_department_ids(
        db,
        payload.department_ids,
        payload.department_names,
        payload.department_id,
        payload.department_name,
    )

    if current_user.role.name == "hod":
        hod_dept_ids = _get_user_department_ids(db, current_user)
        for dep_id in resolved_department_ids:
            if dep_id not in hod_dept_ids:
                raise HTTPException(403, "HOD can only appoint staff within their own department")

    primary_department_id = resolved_department_ids[0]
    new_staff = _create_control_user(
        db,
        payload,
        "staff",
        primary_department_id,
        current_user,
        department_ids=resolved_department_ids,
    )
    return ControlUserOut(
        id=new_staff.id,
        name=new_staff.name,
        email=new_staff.email,
        role="staff",
        department_id=new_staff.department_id,
        department_ids=resolved_department_ids,
    )


@router.delete("/control-user/{user_id}")
def delete_control_user(
    user_id: int,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master", "master", "admin", "hod", "staff")),
):
    """
    Only Master Control can delete an Admin, HOD, or Staff account —
    this is enforced here at the API layer, not just hidden in the UI.
    """
    target = db.query(ControlUser).filter(ControlUser.id == user_id).first()
    if not target:
        raise HTTPException(404, "Control user not found")
    if not _can_manage_control_user(current_user, target):
        raise HTTPException(403, "You are not allowed to delete this user")

    log_action(
        db,
        actor_id=current_user.id,
        action="delete_control_user",
        target_type="control_user",
        target_id=target.id,
        details=f"Deleted {target.email} (role={target.role.name})",
    )
    db.delete(target)
    db.commit()

    return {"message": f"Deleted {target.email}"}


@router.patch("/control-user/{user_id}/status")
def update_control_user_status(
    user_id: int,
    payload: ControlUserStatusUpdateRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master", "master", "admin", "hod", "staff")),
):
    target = db.query(ControlUser).filter(ControlUser.id == user_id).first()
    if not target:
        raise HTTPException(404, "Control user not found")
    if not _can_manage_control_user(current_user, target):
        raise HTTPException(403, "You are not allowed to update this user status")

    target.is_active = payload.is_active

    log_action(
        db,
        actor_id=current_user.id,
        action="continue_control_user" if payload.is_active else "pause_control_user",
        target_type="control_user",
        target_id=target.id,
        details=f"Set is_active={payload.is_active} for {target.email}",
    )
    db.commit()

    return {"message": f"Updated {target.email} status to {'active' if payload.is_active else 'inactive'}"}


@router.get("/list", response_model=list[ControlUserOut])
def list_control_users(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master", "master", "admin", "hod", "staff")),
):
    """
    super_master sees everyone.
    master/admin/hod see only users in their own institution.
    hod is further restricted to users in their own department.
    """
    query = db.query(ControlUser)
    if current_user.role.name != "super_master":
        query = query.filter(ControlUser.institution_id == current_user.institution_id)

    users = query.all()

    if current_user.role.name in {"hod", "staff"}:
        allowed_department_ids = _get_user_department_ids(db, current_user)
        users = [u for u in users if u.department_id in allowed_department_ids]

    dept_map = {}
    staff_ids = [u.id for u in users if u.role.name == "staff"]
    if staff_ids:
        rows = db.query(ControlUserDepartment).filter(ControlUserDepartment.control_user_id.in_(staff_ids)).all()
        for row in rows:
            dept_map.setdefault(row.control_user_id, set()).add(row.department_id)

    return [
        ControlUserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role.name,
            department_id=u.department_id,
            department_ids=sorted(list(dept_map.get(u.id, set()) | ({u.department_id} if u.department_id else set()))) if u.role.name == "staff" else ([u.department_id] if u.department_id else []),
            is_active=u.is_active,
        )
        for u in users
    ]


@router.get("/institutions", response_model=list[InstitutionOut])
def list_institutions(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "super_master")),
):
    """
    Return a list of institutions. Restricted to master and super_master roles.
    """
    insts = db.query(Institution).all()
    return [
        InstitutionOut(
            id=i.id,
            name=i.name,
            code=i.code,
            email_domain=i.email_domain,
            type=i.type,
            status=i.status,
        )
        for i in insts
    ]


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master", "master", "admin", "hod", "staff")),
):
    departments = db.query(Department).order_by(Department.name.asc()).all()
    return [DepartmentOut(id=d.id, name=d.name) for d in departments]


@router.post("/students", response_model=StudentOut)
def create_student(
    payload: StudentCreateRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod", "staff")),
):
    _ensure_dynamic_tables(db)

    department_id = _resolve_department_id(db, payload.department_id, payload.department_name)
    if current_user.role.name in {"hod", "staff"} and not _can_access_department(db, current_user, department_id):
        raise HTTPException(403, "You can create students only for your own department")

    existing_email = db.query(Student).filter(Student.email == payload.email).first()
    if existing_email:
        raise HTTPException(400, "Student email already exists")

    existing_code = db.query(Student).filter(Student.student_code == payload.student_code).first()
    if existing_code:
        raise HTTPException(400, "Student code already exists")

    existing_phone = db.query(Student).filter(Student.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(400, "Student phone already exists")

    student = Student(
        institution_id=current_user.institution_id,
        student_code=payload.student_code,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        department_id=department_id,
        phone_verified=True,
        is_active=True,
        invited_by=current_user.id,
    )
    db.add(student)
    db.flush()

    db.add(
        StudentCredential(
            student_id=student.id,
            password_hash=hash_password(payload.password),
        )
    )

    log_action(
        db,
        actor_id=current_user.id,
        action="create_student",
        target_type="student",
        target_id=student.id,
        details=f"Created student {student.email} with department_id={department_id}",
    )
    db.commit()
    db.refresh(student)
    return StudentOut(
        id=student.id,
        name=student.name,
        email=student.email,
        phone=student.phone,
        student_code=student.student_code,
        department_id=student.department_id,
        is_active=student.is_active,
        phone_verified=student.phone_verified,
    )


@router.get("/students", response_model=list[StudentOut])
def list_students(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod", "staff")),
):
    query = db.query(Student).filter(Student.institution_id == current_user.institution_id)
    if current_user.role.name in {"hod", "staff"}:
        allowed_department_ids = _get_user_department_ids(db, current_user)
        query = query.filter(Student.department_id.in_(allowed_department_ids))

    rows = query.order_by(Student.id.desc()).all()
    return [
        StudentOut(
            id=s.id,
            name=s.name,
            email=s.email,
            phone=s.phone,
            student_code=s.student_code,
            department_id=s.department_id,
            is_active=s.is_active,
            phone_verified=s.phone_verified,
        )
        for s in rows
    ]


@router.post("/timetable", response_model=TimetableOut)
def create_timetable_entry(
    payload: TimetableCreateRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod", "staff")),
):
    _ensure_dynamic_tables(db)

    department_id = _resolve_department_id(db, payload.department_id, payload.department_name)
    if current_user.role.name in {"hod", "staff"} and not _can_access_department(db, current_user, department_id):
        raise HTTPException(403, "You can create timetable entries only for your own department")

    entry = TimetableEntry(
        institution_id=current_user.institution_id,
        department_id=department_id,
        subject=payload.subject.strip(),
        day_of_week=payload.day_of_week.strip(),
        start_time=payload.start_time.strip(),
        end_time=payload.end_time.strip(),
        created_by=current_user.id,
        is_active=True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/timetable", response_model=list[TimetableOut])
def list_timetable_entries(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod", "staff")),
):
    _ensure_dynamic_tables(db)

    query = db.query(TimetableEntry).filter(TimetableEntry.institution_id == current_user.institution_id)
    if current_user.role.name in {"hod", "staff"}:
        allowed_department_ids = _get_user_department_ids(db, current_user)
        query = query.filter(TimetableEntry.department_id.in_(allowed_department_ids))

    return query.order_by(TimetableEntry.id.desc()).all()


@router.post("/timetable/{entry_id}/start-session")
def start_session_from_timetable(
    entry_id: int,
    payload: StartSessionFromTimetableRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "admin", "hod", "staff")),
):
    _ensure_dynamic_tables(db)

    entry = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.id == entry_id, TimetableEntry.institution_id == current_user.institution_id)
        .first()
    )
    if not entry:
        raise HTTPException(404, "Timetable entry not found")

    if current_user.role.name in {"hod", "staff"} and not _can_access_department(db, current_user, entry.department_id):
        raise HTTPException(403, "You can start sessions only for your own department")

    session = ClassSession(
        teacher_id=None,
        department_id=entry.department_id,
        subject=entry.subject,
        teacher_lat=payload.teacher_lat,
        teacher_lng=payload.teacher_lng,
        radius_meters=payload.radius_meters,
        status="active",
    )
    db.add(session)
    db.flush()

    target_students = (
        db.query(Student)
        .filter(
            Student.institution_id == current_user.institution_id,
            Student.department_id == entry.department_id,
            Student.is_active == True,  # noqa: E712
            Student.phone_verified == True,  # noqa: E712
        )
        .all()
    )

    for student in target_students:
        db.add(
            Alert(
                session_id=session.id,
                student_id=student.id,
                alert_type="session_reminder",
                message=f"Reminder: {entry.subject} session started ({entry.day_of_week} {entry.start_time})",
                resolved=False,
            )
        )

    db.commit()
    return {
        "message": "Session started and reminders sent",
        "session_id": session.id,
        "subject": entry.subject,
        "notified_students": len(target_students),
    }


@router.patch("/institutions/{institution_id}/status")
def update_institution_status(
    institution_id: int,
    payload: InstitutionStatusUpdateRequest,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master")),
):
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(404, "Institution not found")

    normalized_status = (payload.status or "").strip().lower()
    if normalized_status not in {"active", "inactive"}:
        raise HTTPException(400, "Status must be 'active' or 'inactive'")

    institution.status = normalized_status
    log_action(
        db,
        actor_id=current_user.id,
        action="unsuspend_institution" if normalized_status == "active" else "suspend_institution",
        target_type="institution",
        target_id=institution.id,
        details=f"Set institution status to {normalized_status}",
    )
    db.commit()
    return {"message": f"Institution status updated to {normalized_status}"}


@router.delete("/institutions/{institution_id}")
def delete_institution(
    institution_id: int,
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("super_master")),
):
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(404, "Institution not found")

    linked_controls = db.query(ControlUser).filter(ControlUser.institution_id == institution_id).count()
    linked_students = db.query(Student).filter(Student.institution_id == institution_id).count()
    if linked_controls > 0 or linked_students > 0:
        raise HTTPException(
            400,
            "Cannot delete institution with linked users/students. Suspend it instead.",
        )

    log_action(
        db,
        actor_id=current_user.id,
        action="delete_institution",
        target_type="institution",
        target_id=institution.id,
        details=f"Deleted institution {institution.name}",
    )
    db.delete(institution)
    db.commit()
    return {"message": f"Deleted institution {institution.name}"}



@router.get("/stats", response_model=AdminStatsOut)
def admin_stats(
    db: DBSession = Depends(get_db),
    current_user: ControlUser = Depends(require_role("master", "super_master")),
):
    """
    Return computed overview stats for the Super Master dashboard.
    """
    institutions_count = db.query(func.count(Institution.id)).scalar() or 0
    pending_requests_count = db.query(func.count(Institution.id)).filter(Institution.status != 'active').scalar() or 0

    # Count active masters
    active_masters_count = (
        db.query(func.count(ControlUser.id))
        .join(Role, ControlUser.role_id == Role.id)
        .filter(Role.name == 'master', ControlUser.is_active == True)
        .scalar()
        or 0
    )

    # System uptime is a placeholder here; real uptime could come from monitoring
    system_uptime = '99.9%'

    return AdminStatsOut(
        institutions_count=institutions_count,
        active_masters_count=active_masters_count,
        pending_requests_count=pending_requests_count,
        system_uptime=system_uptime,
    )

from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, DECIMAL, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)
    code = Column(String(50), nullable=True)
    email_domain = Column(String(100), nullable=True)
    logo = Column(String(255), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(TIMESTAMP, server_default=func.now())


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String(30), unique=True, nullable=False)  # master | admin | hod | staff


class ControlUser(Base):
    __tablename__ = "control_users"
    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("control_users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    role = relationship("Role")
    institution = relationship("Institution")


class ControlUserDepartment(Base):
    __tablename__ = "control_user_departments"
    __table_args__ = (
        UniqueConstraint("control_user_id", "department_id", name="uq_control_user_department"),
    )

    id = Column(Integer, primary_key=True)
    control_user_id = Column(Integer, ForeignKey("control_users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    password_hash = Column(Text, nullable=False)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    student_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    phone_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    invited_by = Column(Integer, ForeignKey("control_users.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    institution = relationship("Institution")


class StudentCredential(Base):
    __tablename__ = "student_credentials"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class StudentDevice(Base):
    __tablename__ = "student_devices"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    device_token = Column(Text, unique=True, nullable=False)  # UUID stored client-side (MVP)
    device_label = Column(String(100))
    is_primary = Column(Boolean, default=True)
    linked_at = Column(TIMESTAMP, server_default=func.now())


class StudentInvite(Base):
    __tablename__ = "student_invites"
    id = Column(Integer, primary_key=True)
    email = Column(String(150), nullable=False)
    phone = Column(String(15), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    invited_by = Column(Integer, ForeignKey("control_users.id"))
    invite_token = Column(Text, unique=True, nullable=False)
    status = Column(String(20), default="pending")  # pending | accepted | expired
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class OtpRequest(Base):
    __tablename__ = "otp_requests"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(30), nullable=False)  # registration | new_device | login_retry
    attempts = Column(Integer, default=0)
    expires_at = Column(TIMESTAMP, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    subject = Column(String(100))
    teacher_lat = Column(DECIMAL(10, 7), nullable=False)
    teacher_lng = Column(DECIMAL(10, 7), nullable=False)
    radius_meters = Column(Integer, default=40)
    start_time = Column(TIMESTAMP, server_default=func.now())
    end_time = Column(TIMESTAMP, nullable=True)
    status = Column(String(20), default="active")  # active | closed


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    created_by = Column(Integer, ForeignKey("control_users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    student_lat = Column(DECIMAL(10, 7))
    student_lng = Column(DECIMAL(10, 7))
    distance_meters = Column(DECIMAL(8, 2))
    device_token = Column(Text)
    status = Column(String(20), nullable=False)  # present | flagged | absent
    marked_at = Column(TIMESTAMP, server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "control_audit_log"
    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("control_users.id"))
    action = Column(String(50), nullable=False)
    target_type = Column(String(30))
    target_id = Column(Integer)
    details = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

from pydantic import BaseModel, EmailStr
from typing import Optional


class AppointAdminRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class AppointMasterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    institution_id: int


class AppointHodRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None


class AppointStaffRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    department_ids: Optional[list[int]] = None
    department_names: Optional[list[str]] = None


class ControlUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int] = None
    department_ids: Optional[list[int]] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class CreateInstitutionRequest(BaseModel):
    name: str
    code: str
    email_domain: str
    type: str = "Institution"
    status: str = "active"


class InstitutionOut(BaseModel):
    id: int
    name: str
    code: str
    email_domain: str
    type: str
    status: str

    class Config:
        from_attributes = True


class AdminStatsOut(BaseModel):
    institutions_count: int
    active_masters_count: int
    pending_requests_count: int
    system_uptime: str

    class Config:
        from_attributes = True


class ControlUserStatusUpdateRequest(BaseModel):
    is_active: bool


class InstitutionStatusUpdateRequest(BaseModel):
    status: str


class DepartmentOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class StudentCreateRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    student_code: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    password: str


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    student_code: str
    department_id: int
    is_active: bool
    phone_verified: bool

    class Config:
        from_attributes = True


class TimetableCreateRequest(BaseModel):
    subject: str
    day_of_week: str
    start_time: str
    end_time: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None


class TimetableOut(BaseModel):
    id: int
    institution_id: int
    department_id: int
    subject: str
    day_of_week: str
    start_time: str
    end_time: str
    is_active: bool

    class Config:
        from_attributes = True


class StartSessionFromTimetableRequest(BaseModel):
    teacher_lat: float
    teacher_lng: float
    radius_meters: int = 40

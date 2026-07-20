from app.database import SessionLocal
from app.models.models import ControlUser, Role
from app.auth.security import hash_password

db = SessionLocal()

role = db.query(Role).filter(Role.name == "master").first()

if role is None:
    print("Master role not found.")
    exit()

existing = db.query(ControlUser).filter(ControlUser.role_id == role.id).first()

if existing:
    print("Master user already exists.")
    exit()

master = ControlUser(
    name="Master Control",
    email="master@example.com",
    phone="9999999999",
    password_hash=hash_password("Admin@123"),
    role_id=role.id,
    department_id=None,
    created_by=None,
    is_active=True,
)

db.add(master)
db.commit()

print("First Master account created successfully!")
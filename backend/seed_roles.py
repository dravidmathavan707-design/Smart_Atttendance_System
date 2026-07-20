"""
Run once after your first `alembic upgrade head`:
    python seed_roles.py

Creates the role hierarchy and an initial super-master account from environment variables.
"""
import os
from dotenv import load_dotenv
from app.database import SessionLocal
from app.models.models import Role, ControlUser, Institution
from app.auth.security import hash_password

load_dotenv()

ROLE_NAMES = ["master", "admin", "hod", "staff", "super_master"]


def seed_roles(db):
    created = []
    for name in ROLE_NAMES:
        existing = db.query(Role).filter(Role.name == name).first()
        if not existing:
            db.add(Role(name=name))
            created.append(name)
    db.commit()
    print(f"Roles ensured: {ROLE_NAMES} (newly created: {created or 'none'})")


def seed_super_master_user(db):
    email = os.getenv("SUPER_MASTER_EMAIL")
    password = os.getenv("SUPER_MASTER_PASSWORD")
    name = os.getenv("SUPER_MASTER_NAME", "Super Master")
    phone = os.getenv("SUPER_MASTER_PHONE", "+919999999999")

    if not email or not password:
        print("SUPER_MASTER_EMAIL and SUPER_MASTER_PASSWORD are not set; skipping bootstrap super-master account.")
        return

    existing_super_master = (
        db.query(ControlUser)
        .join(Role)
        .filter(Role.name == "super_master")
        .first()
    )
    if existing_super_master:
        print(f"Super Master account already exists: {existing_super_master.email}")
        return

    super_role = db.query(Role).filter(Role.name == "super_master").first()
    institution = db.query(Institution).filter(Institution.id == 1).first()
    if not institution:
        institution = Institution(name="Default Institution", type="Institution", code="DEF", email_domain="example.edu", status="active")
        db.add(institution)
        db.flush()

    super_master = ControlUser(
        institution_id=institution.id,
        name=name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role_id=super_role.id,
        department_id=None,
        is_active=True,
    )
    db.add(super_master)
    db.commit()
    print(f"Super Master account created: {email}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_super_master_user(db)
    finally:
        db.close()

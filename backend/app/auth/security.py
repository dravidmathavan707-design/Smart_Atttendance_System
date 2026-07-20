import os
import random
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET", "change_this_secret_key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 120))
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", 5))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", 5))
DEVICE_PROOF_EXPIRE_DAYS = int(os.getenv("DEVICE_PROOF_EXPIRE_DAYS", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def hash_user_agent(user_agent: str) -> str:
    normalized = (user_agent or "").strip().lower()
    if len(normalized) > 400:
        normalized = normalized[:400]
    # Built-in hash() is process-randomized, so use deterministic JWT payload instead.
    import hashlib
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def create_device_proof(student_id: int, device_token: str, user_agent: str) -> str:
    expire = datetime.utcnow() + timedelta(days=DEVICE_PROOF_EXPIRE_DAYS)
    payload = {
        "sub": str(student_id),
        "type": "device_proof",
        "device_token": device_token,
        "ua_hash": hash_user_agent(user_agent),
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_device_proof(
    proof_token: str,
    student_id: int,
    device_token: str,
    user_agent: str,
) -> bool:
    try:
        payload = jwt.decode(proof_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return False

    if payload.get("type") != "device_proof":
        return False
    if payload.get("sub") != str(student_id):
        return False
    if payload.get("device_token") != device_token:
        return False
    if payload.get("ua_hash") != hash_user_agent(user_agent):
        return False

    return True


def generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def otp_expiry_time() -> datetime:
    return datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)


def send_otp_sms(phone: str, otp_code: str):
    """
    MVP stub — replace with a real SMS provider (MSG91 / Twilio) in Phase 2.
    Server time is always used for expiry, never the client's clock.
    """
    print(f"[OTP] Sending {otp_code} to {phone} (expires in {OTP_EXPIRE_MINUTES} min)")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import models  # noqa: F401 — ensures models are registered on Base.metadata
from app.auth.routes import router as auth_router
from app.otp.routes import router as otp_router
from app.api.sessions import router as sessions_router
from app.api.attendance import router as attendance_router
from app.api.admin import router as admin_router

app = FastAPI(title="Smart Attendance System API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict this to your frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(otp_router)
app.include_router(sessions_router)
app.include_router(attendance_router)
app.include_router(admin_router)

# Table creation is now handled by Alembic migrations (see migrations/ folder),
# not by the app on startup. Run `alembic upgrade head` before starting the server.


@app.get("/")
def root():
    return {"status": "ok", "service": "attendance-system-api"}

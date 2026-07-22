delpoyed in render 
the render link:https://smart-attendance-frontend-3u10.onrender.com

# Smart Attendance System — Phase 1 (MVP) Skeleton

This is a working skeleton for the Phase 1 MVP described in the design doc:
student invite/OTP → device binding → session start → GPS-based attendance marking → live dashboard.

## Backend setup (FastAPI + PostgreSQL)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit DATABASE_URL and JWT_SECRET

# Create the database first (e.g. via psql):
#   CREATE DATABASE attendance_db;

# Create all tables using Alembic (do this instead of manual CREATE TABLE):
alembic revision --autogenerate -m "initial tables"
alembic upgrade head

# Create the 4 roles + your first Master Control login:
python seed_roles.py

uvicorn main:app --reload --port 8000
```

### What just happened with Alembic
- `alembic revision --autogenerate -m "..."` — compares your SQLAlchemy models (`app/models/models.py`)
  against the current database, and writes a migration script in `migrations/versions/` describing
  the exact `CREATE TABLE` statements needed
- `alembic upgrade head` — actually runs that script against your PostgreSQL database
- From now on, whenever you add or change a model class, repeat both commands — Alembic figures out
  the difference and generates a new migration automatically, instead of you writing SQL by hand
- Check `migrations/versions/` — you'll see a timestamped Python file; open it to see the generated
  `CREATE TABLE` code, this is worth reading once to understand what Alembic is doing under the hood

Once running, open `http://localhost:8000/docs` for interactive API docs (Swagger UI) —
this is the fastest way to test the invite → OTP → attendance flow without a frontend.

### Test the flow via Swagger UI
1. `POST /otp/invite` — enter a department_id (create one manually in the DB first), email, phone
2. `POST /otp/request-otp/{invite_token}` — OTP will print to your terminal (SMS is stubbed for now)
3. `POST /otp/verify` — pass the OTP + a random device_token (any string works for testing)
4. `POST /auth/student/login` — pass the same email + device_token to get a JWT access_token
5. Click the "Authorize" button (top right of Swagger UI) and paste the token as `Bearer <token>`
6. Create a teacher directly in the DB with a bcrypt password hash, then `POST /auth/teacher/login`
7. `POST /sessions/start` — pass teacher GPS coordinates (now uses the logged-in teacher automatically)
8. `POST /attendance/mark` — pass matching student GPS + the same device_token from step 3
9. `GET /attendance/{session_id}/dashboard` — see present/absent lists

## Frontend setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Note: attendance marking currently hardcodes `student_id = 1`
and session start hardcodes `teacher_id = 1` in the backend — replace these with values from
the authenticated JWT once the login/auth middleware is wired up (see "Not yet implemented" below).

## What's implemented (Phase 1 MVP)
- Database models: departments, roles, control_users, teachers, students, student_devices,
  student_invites, otp_requests, sessions, attendance_logs, alerts, audit log
- Alembic migrations wired up (`alembic revision --autogenerate` / `alembic upgrade head`)
- `seed_roles.py` — creates the 4 roles and your first Master Control account
- Student invite + OTP verification + device token binding
- JWT login: students (email + device token), teachers and control users (email + password)
- **Admin appointment chain (`/admin/*`), fully tested via automated test client:**
  - Master only → appoint another Master, or appoint an Admin
  - Master/Admin → appoint HOD
  - Master/Admin/HOD → appoint Staff (HOD restricted to their own department — verified)
  - Master only → delete any control account (verified HOD/Staff cannot)
  - Every appointment/deletion writes to `control_audit_log`
  - `/admin/list` — Master/Admin see everyone, HOD sees only their department
- Session start (GPS captured once, never updated) and close — tied to the logged-in teacher
- Attendance marking: JWT auth → device token check → duplicate check → GPS distance (Haversine) → present/flagged
- Live present/absent dashboard by department

## Not yet implemented (next steps)
- Student invite endpoint doesn't yet enforce that only HOD/Staff can call it (add `require_role` there too)
- Real SMS provider integration (currently prints OTP to console)
- Alerts + WebSocket push
- Random re-verification, geofence exit detection, offline sync (Phase 2)
- Hard device lock / MDM (Phase 3 — documented, not built, see design doc)

## Project structure
See `attendance-system-structure.md` (the full design doc) for the complete schema,
role hierarchy, and phased build plan this skeleton follows.
<!-- <!-- .\venv\Scripts\python -m uvicorn main:app --reload  important -->

<!-- backend 
cd "c:\Users\dravi\OneDrive\Documents\attendance-system\backend"
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

http://127.0.0.1:8000/docs
forend
cd "c:\Users\dravi\OneDrive\Documents\attendance-system\backend"
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

http://localhost:5173/login


login cd "c:\Users\dravi\OneDrive\Documents\attendance-system\backend"
.\venv\Scripts\python.exe -c "import requests; payload={'institution_id': 1, 'email': 'dravidmathavan707@gmail.com', 'password': 'DM.dravid'}; r=requests.post('http://127.0.0.1:8000/auth/staff/login', json=payload); print(r.status_code); print(r.text)"-->

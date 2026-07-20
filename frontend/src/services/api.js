import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const DEVICE_PROOF_KEY = "device_proof";

export const api = axios.create({ baseURL: API_BASE_URL });

// Attach the JWT (if we have one) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Device token: generated once, stored locally, used for all device-lock checks.
// MVP approach — see design doc for why this is used instead of a native device ID.
export function getDeviceToken() {
  let token = localStorage.getItem("device_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("device_token", token);
  }
  return token;
}

function getDeviceProof() {
  return localStorage.getItem(DEVICE_PROOF_KEY) || "";
}

function setDeviceProof(proof) {
  if (proof) {
    localStorage.setItem(DEVICE_PROOF_KEY, proof);
  }
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ---- Auth ----
export const studentLogin = async (institutionId, email) => {
  const res = await api.post("/auth/student/login", {
    institution_id: institutionId,
    email,
    device_token: getDeviceToken(),
    device_proof: getDeviceProof(),
  });
  localStorage.setItem("access_token", res.data.access_token);
  setDeviceProof(res.data.device_proof);
  return res.data;
};

export const teacherLogin = async (email, password) => {
  const res = await api.post("/auth/teacher/login", { email, password });
  localStorage.setItem("access_token", res.data.access_token);
  return res.data;
};

// ---- OTP / Invite ----
export const requestOtp = (inviteToken) =>
  api.post(`/otp/request-otp/${inviteToken}`);

export const verifyOtp = async (inviteToken, otpCode) => {
  const res = await api.post("/otp/verify", {
    invite_token: inviteToken,
    otp_code: otpCode,
    device_token: getDeviceToken(),
  });
  setDeviceProof(res.data?.device_proof);
  return res;
};

// ---- Sessions ----
export const startSession = (data) => api.post("/sessions/start", data);
export const closeSession = (sessionId) => api.post(`/sessions/${sessionId}/close`);
export const getActiveSessions = (deptId) => api.get(`/sessions/active/${deptId}`);

// ---- Attendance ----
export const markAttendance = async (sessionId) => {
  const pos = await getCurrentPosition();
  return api.post("/attendance/mark", {
    session_id: sessionId,
    student_lat: pos.lat,
    student_lng: pos.lng,
    device_token: getDeviceToken(),
    device_proof: getDeviceProof(),
  });
};

export const getSessionDashboard = (sessionId) =>
  api.get(`/attendance/${sessionId}/dashboard`);

import { useState, useEffect } from "react";
import { startSession, getSessionDashboard, getCurrentPosition } from "../services/api";

export default function SessionDashboard() {
  const [session, setSession] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const handleStart = async () => {
    const pos = await getCurrentPosition();
    const res = await startSession({
      department_id: 1,
      subject: "CS301",
      teacher_lat: pos.lat,
      teacher_lng: pos.lng,
      radius_meters: 40,
    });
    setSession(res.data);
  };

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const res = await getSessionDashboard(session.id);
      setDashboard(res.data);
    }, 5000); // MVP polling — upgrade to WebSocket in Phase 2
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Teacher — Session Control</h2>
      {!session ? (
        <button onClick={handleStart}>Start Session</button>
      ) : (
        <p>Session #{session.id} active — {session.subject}</p>
      )}

      {dashboard && (
        <div style={{ marginTop: 24, display: "flex", gap: 32 }}>
          <div>
            <h3>Present ({dashboard.counts.present})</h3>
            <ul>
              {dashboard.present.map((s) => (
                <li key={s.reg_no}>{s.reg_no} — {s.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Absent ({dashboard.counts.absent})</h3>
            <ul>
              {dashboard.absent.map((s) => (
                <li key={s.reg_no}>{s.reg_no} — {s.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Lock Removed ({dashboard.counts.lock_removed || 0})</h3>
            <ul>
              {(dashboard.lock_removed || []).map((s) => (
                <li key={`${s.reg_no}-${s.timestamp}`}>
                  {s.reg_no} — {s.name}
                  <br />
                  <small>{s.reason}</small>
                  <br />
                  <small>{new Date(s.timestamp).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

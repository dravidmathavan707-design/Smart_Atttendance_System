import { useState } from "react";
import { markAttendance } from "../services/api";

export default function MarkAttendance({ sessionId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMark = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await markAttendance(sessionId);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h2>Mark Attendance</h2>
      <button onClick={handleMark} disabled={loading}>
        {loading ? "Checking location..." : "Mark Present"}
      </button>

      {result && (
        <div style={{ marginTop: 16, color: result.status === "present" ? "green" : "orange" }}>
          <strong>{result.status.toUpperCase()}</strong>
          <p>{result.message}</p>
          <p>Distance: {result.distance_meters}m</p>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}
    </div>
  );
}

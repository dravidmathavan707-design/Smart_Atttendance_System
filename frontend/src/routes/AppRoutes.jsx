import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import SuperMasterDashboard from '../pages/SuperMaster/Dashboard';
import InstitutionMasterDashboard from '../pages/InstitutionMaster/Dashboard';
import StudentDashboard from '../pages/Student/Dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/super-master"
        element={(
          <ProtectedRoute allowedRoles={["super_master"]}>
            <SuperMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/institution-master"
        element={(
          <ProtectedRoute allowedRoles={["master"]}>
            <InstitutionMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/master"
        element={(
          <ProtectedRoute allowedRoles={["master"]}>
            <InstitutionMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={["admin", "super_master", "master"]}>
            <InstitutionMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/hod"
        element={(
          <ProtectedRoute allowedRoles={["hod", "admin", "master", "super_master"]}>
            <InstitutionMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/staff"
        element={(
          <ProtectedRoute allowedRoles={["staff", "hod", "admin", "master", "super_master"]}>
            <InstitutionMasterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/student"
        element={(
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        )}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

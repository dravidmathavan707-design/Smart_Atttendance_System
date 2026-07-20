import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const normalizedRole = (user.role || '').toLowerCase();
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

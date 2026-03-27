import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Outlet />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
}


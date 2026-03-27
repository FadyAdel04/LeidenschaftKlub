import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * Wraps routes that require authentication (and optionally a specic role).
 * - Shows a spinner while the session is being loaded.
 * - Redirects to /login if the user is not authenticated.
 * - Redirects to / if the user's role is not allowed.
 */
export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // While Supabase is rehydrating the session, show a centred spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F5F5F0]">
        <div className="w-8 h-8 rounded-full border-4 border-[#1A1A1A]/10 border-t-[#C62828] animate-spin" />
      </div>
    );
  }

  // Not authenticated → go to login
  if (!user) return <Navigate to={redirectTo} replace />;

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

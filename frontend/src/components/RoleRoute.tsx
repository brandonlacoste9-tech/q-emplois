import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

type UserRole = 'client' | 'provider' | 'admin';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: string;
}

export function RoleRoute({ children, allowedRoles, fallback = '/dashboard' }: RoleRouteProps) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        {children}
      </RoleGuard>
    </ProtectedRoute>
  );
}

function RoleGuard({ children, allowedRoles, fallback = '/dashboard' }: RoleRouteProps) {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quebec-blue" />
      </div>
    );
  }

  const role = profile?.role ?? 'client';
  if (!allowedRoles.includes(role as UserRole)) {
    return <Navigate to={fallback ?? '/dashboard'} replace />;
  }

  return <>{children}</>;
}

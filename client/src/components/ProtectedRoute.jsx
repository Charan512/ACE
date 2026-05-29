import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute component wraps routes that require authentication.
 * Optional `allowedRoles` array restricts access further.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-obsidian">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-cyan" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL so we can return them later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // If not allowed, send back to dashboard or home
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

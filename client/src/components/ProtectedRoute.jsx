import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute component wraps routes that require authentication.
 * Optional `allowedRoles` array restricts access further.
 */
const ProtectedRoute = ({ allowedRoles = [], allowPasswordChangePending = false }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted URL so we can return them later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If password change is forced/pending, and this route is NOT the password change handler, redirect to it.
  if (user?.requiresPasswordChange && !allowPasswordChangePending) {
    return <Navigate to="/force-password-change" replace />;
  }

  // If password change is NOT pending, and the user tries to access /force-password-change, send them to member dashboard.
  if (!user?.requiresPasswordChange && allowPasswordChangePending) {
    return <Navigate to="/member/dashboard" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Admins go to their portal; everyone else goes to the public home
    const adminRoles = ['admin', 'ebm', 'sbm'];
    const fallback = adminRoles.includes(user.role) ? '/admin' : '/';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

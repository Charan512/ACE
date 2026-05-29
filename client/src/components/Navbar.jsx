import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-sharp bg-obsidian/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          {/* Strict digital cyan accents as per blueprint */}
          <div className="flex h-8 w-8 items-center justify-center bg-cyber-cyan font-mono font-bold text-obsidian">
            ACE
          </div>
          <span className="font-bold tracking-tight text-text-primary">ERP</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-bold text-cyber-orange hover:text-cyber-orange-hover">
                  Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary"
              >
                <UserIcon className="h-4 w-4" />
                <span className="font-data hidden sm:inline-block">
                  {user?.aceId || 'MEMBER'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-outline p-2"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

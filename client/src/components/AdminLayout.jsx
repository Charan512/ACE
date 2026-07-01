import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, ClipboardList, Award,
  LogOut, Shield, Menu, X, Bell, BarChart2, Settings,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import PortalBackground from './ui/PortalBackground';

// ── Nav Items ─────────────────────────────────────────────────
// allowedRoles: undefined = all roles; or array of roles
const NAV_ITEMS = [
  { label: 'Dashboard',     to: '/admin',                icon: LayoutDashboard, end: true  },
  { label: 'Events',        to: '/admin/events',         icon: CalendarDays,    end: false },
  { label: 'Registrations', to: '/admin/registrations',  icon: ClipboardList,   end: false },
  { label: 'Certificates',  to: '/admin/certificates',   icon: Award,           end: false },
  { label: 'Users',         to: '/admin/users',          icon: Users,           end: false, allowedRoles: ['admin'] },
  { label: 'Settings',      to: '/admin/settings',       icon: Settings,        end: false, allowedRoles: ['admin'] },
];

// ── Role label mapping ────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'System Admin',
  ebm: 'Exec. Body Member',
  sbm: 'Body Member',
  member: 'Member',
};

// ─────────────────────────────────────────────────────────────
// ADMIN LAYOUT — Premium Floating Island Navigation (Desktop)
// ─────────────────────────────────────────────────────────────
const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const roleLabel = ROLE_LABELS[user?.role] || 'Admin';
  const isAdmin = user?.role === 'admin';
  const initials  = isAdmin ? 'AC' : (user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '—');
  const fullName = isAdmin ? 'ACE Admin' : (user?.name || 'Admin');

  // Filter nav items by role
  let visibleNavItems = NAV_ITEMS.filter(
    ({ allowedRoles }) => !allowedRoles || allowedRoles.includes(user?.role)
  );

  // Treasurer link moved to OpsLayout

  return (
    <div className="min-h-screen text-slate-700 flex flex-col bg-slate-50 selection:bg-blue-100">
      <PortalBackground />

      {/* ──────────────────────────────────────────────────────
          PREMIUM FLOATING DESKTOP HEADER + MOBILE HEADER
      ────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 z-30 transition-all duration-500 ease-out flex items-center justify-between
          ${scrolled ? 'lg:top-3' : 'lg:top-6'} 
          top-0 h-16 lg:h-auto px-4 lg:px-5 py-0 lg:py-3 lg:mx-auto lg:max-w-[1200px] lg:rounded-[24px]`}
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)', // Mobile border
          border: '1px solid rgba(226, 232, 240, 0.8)',      // Desktop border overrides bottom
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.1))', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              <Shield className="w-5 h-5" style={{ color: '#2563eb' }} />
            </div>
            <div className="flex flex-col leading-tight hidden xl:flex">
              <span className="text-sm font-black text-slate-900 tracking-tight">ACE Control</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: '#4f46e5' }}>admin.access</span>
            </div>
          </div>

          {/* Desktop Segmented Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 shadow-inner shrink-0">
            {visibleNavItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-4 xl:px-5 py-2.5 rounded-xl text-sm transition-all duration-300 overflow-hidden shrink-0
                  ${isActive
                    ? 'text-blue-700 font-bold bg-white shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} style={{ color: isActive ? '#2563eb' : undefined }} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Desktop: Profile, Notifications + Logout */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Profile Button (Hidden for System Admin) */}
            {!isAdmin && (
              <NavLink
                to="/admin/profile"
                className="group flex items-center gap-3 px-3 py-1.5 rounded-[18px] transition-all duration-300 border border-transparent hover:bg-slate-100/60 hover:border-slate-200/50 hover:shadow-sm cursor-pointer mr-2"
                title="View Profile"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">{fullName}</span>
                  {roleLabel !== 'Admin' && (
                    <span className="text-[10px] font-mono font-bold tracking-widest text-blue-500 uppercase">{roleLabel}</span>
                  )}
                </div>
                <div
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl font-mono font-black text-white shrink-0 shadow-inner group-hover:scale-[1.05] transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  {initials}
                  <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-2 ring-offset-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin/notifications"
                title="Notifications"
                className={({ isActive }) =>
                  `flex items-center justify-center w-10 h-10 rounded-[14px] transition-all duration-300 border ${
                    isActive
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                      : 'bg-slate-100/60 border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 hover:shadow-sm'
                  }`
                }
              >
                <Bell className="w-5 h-5" />
              </NavLink>
            )}

            <div className="w-px h-8 bg-slate-200/80 mx-1" />

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:shadow-sm"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile: Hamburger Button */}
          <button
            className="lg:hidden p-2 rounded-xl bg-slate-100/80 text-slate-600 hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          MAIN CONTENT
      ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 pt-20 lg:pt-32 pb-20 lg:pb-10 min-h-screen w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* ──────────────────────────────────────────────────────
          MOBILE MENU DRAWER
      ────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-slate-50/95 backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 bg-white/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-100">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-slate-900 tracking-wide">Admin Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
            {/* Highly Emphasized Profile Section (Hidden for System Admin) */}
            {!isAdmin && (
              <NavLink to="/admin/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-mono font-bold text-white mb-4 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  {initials}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">{fullName}</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  {roleLabel}
                </span>
              </NavLink>
            )}

            {/* Nav Links */}
            <nav className="flex flex-col gap-2">
              {visibleNavItems.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-blue-50 border border-blue-100 text-blue-700 font-bold'
                        : 'bg-white border border-slate-100 text-slate-600 font-medium hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Logout Section */}
          <div className="p-4 border-t border-slate-200 bg-white/50 pb-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-red-600 bg-red-50 border border-red-100 font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Terminal
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// ── Navigation Items ──────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/member/dashboard', icon: LayoutDashboard },
  { label: 'Profile',   to: '/member/profile',   icon: User },
  { label: 'History',   to: '/member/history',   icon: History },
];

// ── Role Badge ────────────────────────────────────────────────
const ROLE_LABELS = {
  admin:  { label: 'SYSADMIN',    cls: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.1)]' },
  ebm:    { label: 'EXEC BODY',   cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(192,132,252,0.1)]' },
  sbm:    { label: 'STD BODY',    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(96,165,250,0.1)]' },
  member: { label: 'MEMBER',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]' },
};

// ─────────────────────────────────────────────────────────────
// MEMBER LAYOUT — Dev-Centric Dark Mode
// ─────────────────────────────────────────────────────────────
const MemberLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleInfo = ROLE_LABELS[user?.role] || { label: (user?.role || 'USER').toUpperCase(), cls: 'bg-slate-800 text-slate-400 border-slate-700' };
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U_';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans flex flex-col selection:bg-blue-500/30 selection:text-blue-200">

      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-md border-b border-slate-800/50 h-16">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">

          {/* Brand */}
          <NavLink to="/member/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-400 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <Terminal className="w-4 h-4 text-blue-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white tracking-wide">ACE_PORTAL</p>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-tight">System_Active</p>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: User info + logout */}
          <div className="flex items-center gap-4 shrink-0">
            {/* User Identity */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user?.name}</p>
                <span className={`inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${roleInfo.cls}`}>
                  {roleInfo.label}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                <span className="text-slate-300 text-xs font-mono font-bold">{initials}</span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-800" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Terminate Session"
              className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 pt-16 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <nav
            className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      {label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </>
                )}
              </NavLink>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-800">
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 bg-black/50 rounded-lg mb-3 border border-slate-800">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                    <span className="text-white text-xs font-mono font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" /> Terminate Session
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Page Content ─────────────────────────────────────── */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default MemberLayout;

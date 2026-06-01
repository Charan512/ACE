import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, History, LogOut, Terminal } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import PortalBackground from './ui/PortalBackground';

// ── Nav Items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/member/dashboard', icon: LayoutDashboard, short: 'Home'    },
  { label: 'Profile',   to: '/member/profile',   icon: User,            short: 'Profile' },
  { label: 'History',   to: '/member/history',   icon: History,         short: 'History' },
];

// ── Role display map ──────────────────────────────────────────
const ROLE_LABEL = {
  ebm:    'Body Member',
  sbm:    'Body Member',
  member: 'Member',
};

// ─────────────────────────────────────────────────────────────
// MEMBER LAYOUT — Top Navbar (desktop) + Bottom Tabs (mobile)
// ─────────────────────────────────────────────────────────────
const MemberLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const roleLabel = ROLE_LABEL[user?.role] || 'Member';
  const initials  = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '—';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex flex-col">
      <PortalBackground />

      {/* ──────────────────────────────────────────────────────
          TOP HEADER (Mobile & Desktop)
      ────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-30 h-16 flex items-center justify-between px-4 md:px-8"
        style={{
          background: 'rgba(2, 8, 30, 0.95)',
          borderBottom: '1px solid rgba(51,65,85,0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-sm font-semibold text-white">ACE Portal</span>
          </div>

          {/* Desktop Nav Links (Exclude Profile, it goes on the right) */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_ITEMS.filter(i => i.label !== 'Profile').map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
                  ${isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side: Mobile Role OR Desktop Profile Menu */}
        <div className="flex items-center gap-4">
          <span className="md:hidden text-[9px] font-mono text-slate-500">{roleLabel}</span>

          {/* Desktop User / Profile / Logout */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/member/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 border
                ${isActive
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                }`
              }
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-300 font-bold">
                {initials}
              </div>
              <span className="truncate max-w-[100px] text-xs">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          MAIN CONTENT
      ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 pt-16 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* ──────────────────────────────────────────────────────
          BOTTOM TAB BAR — mobile only
      ────────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch"
        style={{
          background: 'rgba(2, 8, 30, 0.95)',
          borderTop: '1px solid rgba(51,65,85,0.4)',
          backdropFilter: 'blur(16px)',
          height: '60px',
        }}
      >
        {NAV_ITEMS.map(({ short, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? '#60a5fa' : '#475569' }}
                />
                <span
                  className="text-[9px] font-mono font-medium"
                  style={{ color: isActive ? '#60a5fa' : '#475569' }}
                >
                  {short}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-slate-600" />
          <span className="text-[9px] font-mono text-slate-600">Exit</span>
        </button>
      </nav>
    </div>
  );
};

export default MemberLayout;

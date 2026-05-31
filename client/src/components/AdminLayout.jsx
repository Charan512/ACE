import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Award,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Command,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// ── Sidebar Navigation Items ─────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Events',
    to: '/admin/events',
    icon: CalendarDays,
    end: false,
  },
  {
    label: 'Registrations',
    to: '/admin/registrations',
    icon: ClipboardList,
    end: false,
  },
  {
    label: 'Certificates',
    to: '/admin/certificates',
    icon: Award,
    end: false,
  },
  {
    label: 'Users',
    to: '/admin/users',
    icon: Users,
    end: false,
  },
];

// ── Role label mapping ────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'Admin',
  ebm: 'Exec. Body Member',
  sbm: 'Student Body Member',
  member: 'Member',
};

const ROLE_COLORS = {
  admin: 'bg-red-50 text-red-600 border-red-100',
  ebm: 'bg-purple-50 text-purple-600 border-purple-100',
  sbm: 'bg-blue-50 text-blue-600 border-blue-100',
  member: 'bg-green-50 text-green-600 border-green-100',
};

// ─────────────────────────────────────────────────────────────
// ADMIN LAYOUT — Fixed Sidebar + Main Content
// ─────────────────────────────────────────────────────────────
const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 min-h-[72px] shrink-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                ACE Control
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Admin Portal
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 select-none
                ${isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate">{label}</span>
                  )}
                  {!collapsed && isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Identity Block */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          {!collapsed && user && (
            <div className="mb-2 px-2 py-2 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              {user.role && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Terminate Session' : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Terminate Session</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* ── Main Content Area ────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-[72px]' : 'ml-[240px]'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">ACE ERP</span>
            <span className="text-slate-300">/</span>
            <span>Admin Portal</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Cmd+K</span>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

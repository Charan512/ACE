import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, LogOut, Zap, Menu, X, BarChart2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import AgentFlowBackground from './ui/AgentFlowBackground';

// ── Nav Items ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Ops Hub',  to: '/ops',     icon: LayoutDashboard, end: true  },
  { label: 'Scanner',  to: '/ops/scan', icon: ScanLine,        end: false },
];

// ── Role label ────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'System Admin',
  ebm:   'Exec. Body Member',
  sbm:   'Body Member',
};

// ─────────────────────────────────────────────────────────────
// OPS LAYOUT — Premium Floating Island Navigation
// Orange/Amber accent to visually differentiate from Admin (Blue)
// and Member (Indigo) portals.
// ─────────────────────────────────────────────────────────────
const OpsLayout = () => {
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

  const roleLabel = ROLE_LABELS[user?.role] || 'Body Member';
  const initials  = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '—';
  const firstName = user?.name?.split(' ')[0] || 'Coordinator';

  // Inject Treasurer Analytics link for the designated Treasurer
  let visibleNavItems = [...NAV_ITEMS];
  if ((user?.role === 'sbm' || user?.role === 'ebm') && user?.designation === 'Treasurer') {
    visibleNavItems.push({
      label: 'Financials',
      to: '/treasurer',
      icon: BarChart2,
      end: false,
    });
  }

  return (
    <div className="min-h-screen text-neutral-300 flex flex-col bg-[#0A0A0A] selection:bg-white/20">
      <AgentFlowBackground />

      {/* ──────────────────────────────────────────────────────
          PREMIUM FLOATING ISLAND HEADER
      ────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 z-30 transition-all duration-500 ease-out flex items-center justify-between
          ${scrolled ? 'md:top-3' : 'md:top-6'}
          top-0 h-16 md:h-auto px-4 md:px-5 py-0 md:py-3 md:mx-auto md:max-w-4xl md:rounded-[24px]`}
        style={{
          background: 'rgba(15, 15, 15, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-black text-white tracking-tight">Ops Hub</span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-500">ops.access</span>
            </div>
          </div>

          {/* Desktop Segmented Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner">
            {visibleNavItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-300
                  ${isActive
                    ? 'text-black font-bold bg-white shadow-sm ring-1 ring-white/20'
                    : 'text-neutral-400 font-medium hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'scale-110 text-black' : 'text-neutral-400'}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right — Profile + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            {/* Unified Profile Button */}
            <NavLink
              to="/ops/profile"
              className="group flex items-center gap-3 px-3 py-1.5 rounded-[18px] transition-all duration-300 border border-transparent hover:bg-white/5 hover:border-white/10 hover:shadow-sm cursor-pointer"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white tracking-tight group-hover:text-neutral-300 transition-colors">{firstName}</span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">{roleLabel}</span>
              </div>
              <div
                className="relative flex items-center justify-center w-10 h-10 rounded-xl font-mono font-black text-white shrink-0 shadow-inner group-hover:scale-[1.05] transition-transform duration-300 bg-[#1A1A1A] border border-white/10"
              >
                {initials}
                <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 ring-offset-2 ring-offset-[#0A0A0A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </NavLink>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-neutral-400 hover:text-white hover:bg-white/10 hover:shadow-sm"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 relative z-10 pt-20 md:pt-32 pb-20 md:pb-10 min-h-screen">
        <Outlet />
      </main>

      {/* ── Mobile Menu Drawer ───────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[#0A0A0A]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 bg-[#151515]/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Ops Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
            {/* Profile */}
            <NavLink to="/ops/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center text-center p-6 bg-[#151515] rounded-3xl border border-white/10 shadow-sm hover:border-white/20 transition-colors cursor-pointer">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-mono font-bold text-black mb-4 shadow-md bg-white border border-white/10">
                {initials}
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{user?.name || 'Coordinator'}</h2>
              <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                {roleLabel}
              </span>
            </NavLink>

            {/* Nav */}
            <nav className="flex flex-col gap-2">
              {visibleNavItems.map(({ label, to, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/5 border border-white/10 text-neutral-400 font-medium hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-white/10 bg-[#151515]/50 pb-8">
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white bg-white/10 border border-white/20 font-bold text-sm hover:bg-white/20 transition-colors">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpsLayout;

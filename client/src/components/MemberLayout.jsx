import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, History, LogOut, Sparkles, Menu, X, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import SoftAurora from './react-bits/SoftAurora';

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
// MEMBER LAYOUT — Premium Floating Island Navigation (Desktop)
// ─────────────────────────────────────────────────────────────
const MemberLayout = () => {
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

  const roleLabel = ROLE_LABEL[user?.role] || 'Member';
  const initials  = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '—';
  const firstName = user?.name?.split(' ')[0] || 'Member';

  return (
    <div className="min-h-screen text-slate-700 flex flex-col selection:bg-indigo-100 relative bg-slate-900">
      <div className="fixed inset-0 z-0 opacity-90 overflow-hidden">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1.0}
          color1="#f7f7f7"
          color2="#b26ebb"
          noiseFrequency={2.5}
          noiseAmplitude={1.0}
          bandHeight={0.5}
          bandSpread={1.0}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={1.0}
          enableMouseInteraction={true}
          mouseInfluence={0.25}
        />
      </div>

      {/* ──────────────────────────────────────────────────────
          PREMIUM FLOATING DESKTOP HEADER + MOBILE HEADER
      ────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 z-30 transition-all duration-500 ease-out flex items-center justify-between
          ${scrolled ? 'md:top-3' : 'md:top-6'} 
          top-0 h-16 md:h-auto px-4 md:px-5 py-0 md:py-3 md:mx-auto md:max-w-5xl md:rounded-[24px]`}
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)', // Mobile border
          border: '1px solid rgba(226, 232, 240, 0.8)',      // Desktop border overrides bottom
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          {/* Mobile Menu Button (Left) */}
          <button
            className="md:hidden p-2 rounded-xl bg-slate-100/80 text-slate-600 hover:bg-slate-200 transition-colors z-10"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo (Desktop) */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-black text-slate-900 tracking-tight">ACE Portal</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>member.access</span>
          </div>

          {/* Desktop Segmented Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            {NAV_ITEMS.filter(i => i.label !== 'Profile').map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 overflow-hidden
                  ${isActive
                    ? 'text-indigo-700 font-bold bg-white shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} style={{ color: isActive ? '#6366f1' : undefined }} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Logo (Center) */}
        <div className="absolute left-1/2 -translate-x-1/2 md:hidden flex flex-col items-center leading-tight pointer-events-none">
          <span className="text-sm font-black text-slate-900 tracking-tight">ACE Portal</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>member.access</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center gap-2">
            
            {/* Unified Profile Button (Visible on both mobile and desktop) */}
            <NavLink
              to="/member/profile"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-1 md:px-3 py-1 md:py-1.5 rounded-[18px] transition-all duration-300 cursor-pointer border border-transparent
                ${isActive ? 'md:bg-indigo-50/80 md:border-indigo-100/50 md:shadow-sm' : 'md:hover:bg-slate-100/60 md:hover:border-slate-200/50 md:hover:shadow-sm'}`
              }
              title="View Profile"
            >
              {/* Desktop Name/Role Text */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">{firstName}</span>
                {roleLabel !== 'Member' && (
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 uppercase">{roleLabel}</span>
                )}
              </div>
              
              {/* Profile Avatar Image */}
              <div
                className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-mono font-black text-white shrink-0 shadow-inner group-hover:scale-[1.05] transition-transform duration-300 overflow-hidden"
                style={{ background: user?.profilePhoto ? '#f8fafc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {/* Subtle indicator ring on hover */}
                <div className="absolute inset-0 rounded-xl ring-2 ring-indigo-400 ring-offset-2 ring-offset-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </NavLink>

            <div className="hidden md:block w-px h-8 bg-slate-200/80 mx-1" />

            <button
              onClick={handleLogout}
              className="hidden md:block p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:shadow-sm"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          MAIN CONTENT
      ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 pt-20 md:pt-32 pb-20 md:pb-10 min-h-screen">
        <Outlet />
      </main>

      {/* ──────────────────────────────────────────────────────
          MOBILE MENU DRAWER
      ────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-50/95 backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 bg-white/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-xs font-bold text-slate-900 tracking-wide">Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
            {/* Highly Emphasized Profile Section */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-mono font-black text-white mb-4 shadow-md overflow-hidden"
                style={{ background: user?.profilePhoto ? '#f8fafc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">{user?.name || 'User'}</h2>
              {roleLabel !== 'Member' && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  {roleLabel}
                </span>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold'
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
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberLayout;

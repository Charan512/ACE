import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, CalendarCheck, Loader2, TrendingUp,
  Activity, ChevronRight, Bell, DollarSign, CreditCard,
  BarChart3, Wifi, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const StatCard = ({ label, value, icon: Icon, accent, sublabel, loading, linkTo, linkLabel, clayColor }) => (
  <div className={`clay-card p-6 overflow-hidden group ${clayColor || 'clay-blue'}`}>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-5">
        <div className={`clay-icon-box w-12 h-12`} style={{ background: `${accent}20` }}>
          <Icon className="w-6 h-6" style={{ color: accent }} />
        </div>
        {linkTo && (
          <Link to={linkTo} className="flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
            {linkLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {loading ? <Loader2 className="w-7 h-7 animate-spin text-slate-300 my-1" /> : (
        <p className="text-4xl font-black text-slate-900 tracking-tight font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}
      <p className="text-sm font-bold text-slate-600 mt-1.5">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, label, description, accent, clayColor }) => (
  <Link to={to} className={`clay-card flex items-center gap-4 p-5 group ${clayColor || 'clay-slate'}`}>
    <div className="clay-icon-box w-11 h-11" style={{ background: `${accent}18` }}>
      <Icon className="w-5 h-5" style={{ color: accent }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{description}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
  </Link>
);

const PayBar = ({ label, count, total, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: color }} />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="clay-badge" style={{ background: `${color}18`, color, borderColor: `${color}30` }}>
          {String.fromCodePoint(0x20B9)}{(total || 0).toLocaleString()} &nbsp;·&nbsp; {count}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (count || 0) * 10)}%`, background: color }} />
      </div>
    </div>
  </div>
);

const PayStatsPanel = () => {
      </div>
    </div>
  </div>
);

const PayStatsPanel = () => {
  const [events, setEvents] = useState([]);
  const [sel, setSel] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/events').then((r) => setEvents(r.data.data || [])).catch(() => {});
  }, []);

  const handleChange = async (e) => {
    const id = e.target.value;
    setSel(id); setStats(null);
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.get(`/admin/events/${id}/payment-stats`);
      setStats(r.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const total = (stats?.online?.totalAmountINR || 0) + (stats?.cash?.totalAmountINR || 0);

  return (
    <div className="clay-card clay-teal p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">Revenue Breakdown</p>
          <p className="text-xs text-slate-400">Online vs cash per event</p>
        </div>
      </div>
      <select value={sel} onChange={handleChange}
        className="clay-input w-full px-4 py-2.5 text-sm font-semibold text-slate-700 mb-4 cursor-pointer appearance-none">
        <option value="">Select an event</option>
        {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
      </select>
      {loading && <div className="flex items-center gap-2 text-slate-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs font-semibold">Loading...</span></div>}
      {stats && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold">Total Revenue</span>
            <span className="text-xl font-black font-mono text-slate-900">{String.fromCodePoint(0x20B9)}{total.toLocaleString()}</span>
          </div>
          <PayBar label="Online (PhonePe)" count={stats.online?.count || 0} total={stats.online?.totalAmountINR || 0} color="#3b82f6" />
          <PayBar label="Cash (Walk-in)" count={stats.cash?.count || 0} total={stats.cash?.totalAmountINR || 0} color="#10b981" />
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <CreditCard className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-black font-mono text-blue-700">{stats.online?.count || 0}</p>
              <p className="text-[10px] text-blue-500 font-bold">Online</p>
            </div>
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-black font-mono text-emerald-700">{stats.cash?.count || 0}</p>
              <p className="text-[10px] text-emerald-500 font-bold">Cash</p>
            </div>
          </div>
        </div>
      )}
      {!stats && !loading && sel && <p className="text-xs text-slate-400 text-center py-4">No payment data yet.</p>}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState({ totalAccounts: 0, totalVerifiedMembers: 0, activeEvents: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState([]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const [statsRes, notifsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/notifications?unreadOnly=true'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (notifsRes.status === 'fulfilled') setUnreadCount(notifsRes.value.data.data?.total || 0);
    } catch (err) {
      setError('Failed to load statistics.');
    } finally { setLoading(false); }
  }, [isAdmin]);

  const fetchOpsEvents = useCallback(async () => {
    if (isAdmin) return;
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data.data || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchAdminData(); fetchOpsEvents(); }, [fetchAdminData, fetchOpsEvents]);

  if (!isAdmin) {
    const activeEvts = events.filter((ev) => ev.isActive);
    const draftEvts = events.filter((ev) => ev.status === 'draft');
    return (
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}.</p>
        </div>
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm font-semibold">Loading...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="clay-card clay-green p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="clay-icon-box w-9 h-9" style={{ background: '#d1fae5' }}><Wifi className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Events</span>
                  </div>
                  <p className="text-4xl font-black font-mono text-slate-900">{activeEvts.length}</p>
                <p className="text-sm text-slate-400 mt-1">registrations open</p>
              </div>
                <div className="clay-card clay-amber p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="clay-icon-box w-9 h-9" style={{ background: '#fef3c7' }}><WifiOff className="w-4 h-4 text-amber-600" /></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Draft Events</span>
                  </div>
                  <p className="text-4xl font-black font-mono text-slate-900">{draftEvts.length}</p>
                <p className="text-sm text-slate-400 mt-1">awaiting publish</p>
              </div>
            </div>
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction to="/ops" icon={BarChart3} label="Ops Dashboard" description="Check-in, scan ACE IDs, cash register" accent="#3b82f6" />
                <QuickAction to="/admin/registrations" icon={TrendingUp} label="View Registrations" description="Browse attendees by event" accent="#10b981" />
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/notifications" title="Cash Registration Notifications"
            className="clay-btn relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all shadow-sm">
            <Bell className="w-5 h-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <button onClick={fetchAdminData} disabled={loading}
            className="clay-btn flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-xl px-4 py-2 transition-all shadow-sm cursor-pointer disabled:opacity-50">
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-5 py-3 rounded-xl">{error}</div>}

      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Registered Accounts" sublabel="All roles excluding guests" value={stats.totalAccounts} icon={Users} accent="#3b82f6" loading={loading} linkTo="/admin/users" linkLabel="View all" clayColor="clay-blue" />
          <StatCard label="Verified Members" sublabel="Active ACE memberships" value={stats.totalVerifiedMembers} icon={UserCheck} accent="#10b981" loading={loading} linkTo="/admin/users?role=member" linkLabel="View members" clayColor="clay-green" />
          <StatCard label="Active Events" sublabel="Live registrations open" value={stats.activeEvents} icon={CalendarCheck} accent="#8b5cf6" loading={loading} linkTo="/admin/events" linkLabel="Manage" clayColor="clay-purple" />  </div>
      </section>

      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Breakdown</h2>
        <PayStatsPanel />
      </section>

      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickAction to="/admin/events" icon={CalendarCheck} label="Manage Events" description="Create events, toggle live status, update details" accent="#3b82f6" clayColor="clay-blue" />
          <QuickAction to="/admin/registrations" icon={TrendingUp} label="View Registrations" description="Attendees, CSV export, payment stats" accent="#10b981" clayColor="clay-green" />
          <QuickAction to="/admin/certificates" icon={DollarSign} label="Certificate Forge" description="Upload templates, release to members" accent="#f59e0b" clayColor="clay-amber" />
          <QuickAction to="/admin/users" icon={Users} label="User Directory" description="Members, SBMs, EBMs — role management" accent="#8b5cf6" clayColor="clay-purple" />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Status</h2>
        <div className="clay-card clay-slate p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stats.activeJobs > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <div>
                <p className="text-sm font-bold text-slate-700">BullMQ Queue Worker</p>
                <p className="text-xs text-slate-400">
                  {loading ? 'Checking...' : stats.activeJobs > 0 ? `${stats.activeJobs} job(s) active / waiting` : 'All queues idle'}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${stats.activeJobs > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {stats.activeJobs > 0 ? 'PROCESSING' : 'IDLE'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;

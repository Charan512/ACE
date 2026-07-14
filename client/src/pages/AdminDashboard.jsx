import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, CalendarCheck, Loader2, TrendingUp,
  Activity, ChevronRight, ChevronDown, Bell, DollarSign, CreditCard,
  BarChart3, Wifi, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const StatCard = ({ label, value, icon: Icon, accent, sublabel, loading, linkTo, linkLabel }) => (
  <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col">
    <div className="relative z-10 flex-1">
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="w-6 h-6" style={{ color: accent }} />
        </div>
        {linkTo && (
          <Link to={linkTo} className="flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
            {linkLabel} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-300 my-2" /> : (
        <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}
      <p className="text-base font-bold text-slate-700 mt-3">{label}</p>
      {sublabel && <p className="text-sm text-slate-500 mt-1">{sublabel}</p>}
    </div>
  </div>
);

const PayBar = ({ label, count, total, color, totalCount }) => (
  <div className="flex items-center gap-3">
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: color }} />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: `${color}15`, color }}>
          {String.fromCodePoint(0x20B9)}{(total || 0).toLocaleString()} &nbsp;·&nbsp; {count}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${totalCount > 0 ? Math.round((count / totalCount) * 100) : 0}%`, background: color }} />
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">Revenue Breakdown</p>
          <p className="text-sm text-slate-500">Online vs cash per event</p>
        </div>
      </div>
      <div className="relative mb-6">
        <select value={sel} onChange={handleChange}
          className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10">
          <option value="">Select an event</option>
          {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      {loading && <div className="flex items-center gap-2 text-slate-400 py-6"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm font-semibold">Loading...</span></div>}
      {stats && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-semibold">Total Revenue</span>
            <span className="text-3xl font-black font-mono text-slate-900">{String.fromCodePoint(0x20B9)}{total.toLocaleString()}</span>
          </div>
          <PayBar label="Online (PhonePe)" count={stats.online?.count || 0} total={stats.online?.totalAmountINR || 0} color="#3b82f6" totalCount={(stats.online?.count || 0) + (stats.cash?.count || 0)} />
          <PayBar label="Cash (Walk-in)" count={stats.cash?.count || 0} total={stats.cash?.totalAmountINR || 0} color="#10b981" totalCount={(stats.online?.count || 0) + (stats.cash?.count || 0)} />
          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-black font-mono text-slate-800">{stats.online?.count || 0}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Online</p>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-black font-mono text-slate-800">{stats.cash?.count || 0}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cash</p>
            </div>
          </div>
        </div>
      )}
      {!stats && !loading && sel && <p className="text-sm text-slate-400 text-center py-6">No payment data yet.</p>}
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
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Events</span>
                </div>
                <p className="text-4xl font-black font-mono text-slate-900">{activeEvts.length}</p>
                <p className="text-sm text-slate-500 mt-1">registrations open</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Draft Events</span>
                </div>
                <p className="text-4xl font-black font-mono text-slate-900">{draftEvts.length}</p>
                <p className="text-sm text-slate-500 mt-1">awaiting publish</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] relative px-4 sm:px-6 py-8">

      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/notifications" title="Cash Registration Notifications"
              className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm">
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <button onClick={fetchAdminData} disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50">
              <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-5 py-3 rounded-xl shadow-sm">{error}</div>}

        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <StatCard label="Verified Members" sublabel="Active ACE memberships" value={stats.totalVerifiedMembers} icon={UserCheck} accent="#2563eb" loading={loading} linkTo="/admin/users?role=member" linkLabel="View members" />
            <StatCard label="Active Events" sublabel="Live registrations open" value={stats.activeEvents} icon={CalendarCheck} accent="#10b981" loading={loading} linkTo="/admin/events" linkLabel="Manage" />  
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Breakdown</h2>
          <PayStatsPanel />
        </section>

        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Status</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${stats.activeJobs > 0 ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-800">BullMQ Queue Worker</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {loading ? 'Checking...' : stats.activeJobs > 0 ? `${stats.activeJobs} job(s) active / waiting` : 'All queues idle'}
                  </p>
                </div>
              </div>
              <span className={`self-start sm:self-auto text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${stats.activeJobs > 0 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                {stats.activeJobs > 0 ? 'Processing' : 'Idle'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  Loader2,
  TrendingUp,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

// ── Stat Card Component ───────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, sublabel, loading, linkTo, linkLabel }) => (
  <div className={`relative bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
    style={{ borderColor: `${accent}20` }}
  >
    {/* Background glow */}
    <div
      className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-20"
      style={{ background: accent }}
    />

    <div className="relative z-10">
      {/* Icon + Label Row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: accent }}
          >
            {linkLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <Loader2 className="w-7 h-7 animate-spin text-slate-300 my-1" />
      ) : (
        <p className="text-4xl font-black text-slate-900 tracking-tight font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}

      {/* Labels */}
      <p className="text-sm font-bold text-slate-500 mt-1">{label}</p>
      {sublabel && (
        <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  </div>
);

// ── Quick Action Link ─────────────────────────────────────────
const QuickAction = ({ to, icon: Icon, label, description, accent }) => (
  <Link
    to={to}
    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${accent}12` }}
    >
      <Icon className="w-5 h-5" style={{ color: accent }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-400 truncate">{description}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
  </Link>
);

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalVerifiedMembers: 0,
    activeEvents: 0,
    activeJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('[AdminDashboard] Stats fetch failed:', err.message);
      setError('Failed to load statistics. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-10">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            System overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-xl px-4 py-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-5 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          System Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Registered Accounts"
            sublabel="All roles excluding guests"
            value={stats.totalAccounts}
            icon={Users}
            accent="#3b82f6"
            loading={loading}
            linkTo="/admin/users"
            linkLabel="View all"
          />
          <StatCard
            label="Verified Members"
            sublabel="Active ACE memberships"
            value={stats.totalVerifiedMembers}
            icon={UserCheck}
            accent="#10b981"
            loading={loading}
            linkTo="/admin/users?role=member"
            linkLabel="View members"
          />
          <StatCard
            label="Active Events"
            sublabel="Live registrations open"
            value={stats.activeEvents}
            icon={CalendarCheck}
            accent="#8b5cf6"
            loading={loading}
            linkTo="/admin/events"
            linkLabel="Manage"
          />
        </div>
      </section>

      {/* ── Quick Actions ────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickAction
            to="/admin/events"
            icon={CalendarCheck}
            label="Manage Events"
            description="Create events, toggle live status, update details"
            accent="#3b82f6"
          />
          <QuickAction
            to="/admin/registrations"
            icon={TrendingUp}
            label="View Registrations"
            description="Browse attendees by event, check status"
            accent="#10b981"
          />
          <QuickAction
            to="/admin/certificates"
            icon={TrendingUp}
            label="Certificate Forge"
            description="Upload blank templates, configure text overlays"
            accent="#f59e0b"
          />
          <QuickAction
            to="/admin/users"
            icon={Users}
            label="User Directory"
            description="Browse Members, SBMs, EBMs — update roles"
            accent="#8b5cf6"
          />
        </div>
      </section>

      {/* ── System Status ────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          System Status
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stats.activeJobs > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <div>
                <p className="text-sm font-bold text-slate-700">BullMQ Queue Worker</p>
                <p className="text-xs text-slate-400">
                  {loading ? 'Checking...' : stats.activeJobs > 0
                    ? `${stats.activeJobs} job(s) active / waiting`
                    : 'All queues idle'}
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

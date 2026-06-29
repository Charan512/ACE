import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, IndianRupee, Users, Zap, ChevronDown,
  Loader2, AlertTriangle, BarChart2,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../utils/api';

// ── Color Palette ─────────────────────────────────────────────
const COLORS = {
  cyan:   '#00d4ff',
  green:  '#39ff14',
  violet: '#7c3aed',
  rose:   '#f43f5e',
  amber:  '#f59e0b',
  slate:  '#475569',
};

// ── Custom Tooltip ────────────────────────────────────────────
const CyberTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs font-mono border"
      style={{ background: '#0d1117', borderColor: '#00d4ff33', color: '#e2e8f0' }}
    >
      {label && <p className="mb-1 text-slate-400">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || COLORS.cyan }}>
          {entry.name}: {prefix}{entry.value?.toLocaleString('en-IN')}{suffix}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent = COLORS.cyan }) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-3 border"
    style={{ background: '#0d1117', borderColor: `${accent}33` }}
  >
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}18`, border: `1px solid ${accent}44` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">{label}</span>
    </div>
    <span
      className="text-3xl font-black font-mono leading-none"
      style={{ color: accent }}
    >
      {value}
    </span>
    {sub && <span className="text-xs text-slate-500 font-mono">{sub}</span>}
  </div>
);

// ── Chart Section Wrapper ─────────────────────────────────────
const Section = ({ title, children }) => (
  <div
    className="rounded-2xl p-5 border"
    style={{ background: '#0d1117', borderColor: '#ffffff0f' }}
  >
    <h3 className="text-xs uppercase tracking-widest font-mono text-slate-400 mb-4">{title}</h3>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// TREASURER DASHBOARD
// ─────────────────────────────────────────────────────────────
const TreasurerDashboard = () => {
  const { user } = useAuthStore();

  // Guard: only SBM with Treasurer designation
  if (!user || user.role !== 'sbm' || user.designation !== 'Treasurer') {
    return <Navigate to="/ops" replace />;
  }

  const [events, setEvents]     = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats]       = useState(null);
  const [eventMeta, setEventMeta] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch all events for the selector dropdown
  useEffect(() => {
    api.get('/admin/events')
      .then(({ data }) => {
        setEvents(data.data || []);
        if (data.data?.length) setSelectedId(data.data[0]._id);
      })
      .catch(() => setError('Failed to load events.'))
      .finally(() => setEventsLoading(false));
  }, []);

  // Fetch stats when an event is selected
  const fetchStats = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const { data } = await api.get(`/admin/treasurer/events/${id}/stats`);
      setStats(data.stats);
      setEventMeta(data.event);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchStats(selectedId);
  }, [selectedId, fetchStats]);

  // Derived chart data
  const paymentPieData = stats ? [
    { name: 'Online',  value: stats.byPaymentMethod.online },
    { name: 'Cash',    value: stats.byPaymentMethod.cash },
  ] : [];

  const tierPieData = stats ? [
    { name: 'Members',     value: stats.byTier.member },
    { name: 'Non-Members', value: stats.byTier.non_member },
  ] : [];

  const revenueBarData = stats ? [
    { name: 'Members',     revenue: stats.revenueByTier.member },
    { name: 'Non-Members', revenue: stats.revenueByTier.non_member },
  ] : [];

  return (
    <div
      className="min-h-screen px-4 pb-16"
      style={{ background: '#0B0F19', fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pt-8 pb-6 border-b mb-8" style={{ borderColor: '#ffffff0f' }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart2 className="w-5 h-5" style={{ color: COLORS.cyan }} />
          <span
            className="text-xs uppercase tracking-widest font-mono"
            style={{ color: COLORS.cyan }}
          >
            ACE ERP · Treasurer Analytics
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight text-white"
        >
          Financial Intelligence
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Per-event registration &amp; revenue breakdown — read-only view
        </p>
      </div>

      {/* ── Event Selector ──────────────────────────────────── */}
      <div className="mb-8">
        <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-mono">
          Select Event
        </label>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
          </div>
        ) : (
          <div className="relative inline-block w-full max-w-md">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-mono text-white border outline-none focus:ring-2 cursor-pointer"
              style={{
                background: '#0d1117',
                borderColor: '#00d4ff33',
                color: '#e2e8f0',
              }}
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id} style={{ background: '#0d1117' }}>
                  {ev.title}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: COLORS.cyan }}
            />
          </div>
        )}
      </div>

      {/* ── Error State ─────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm font-mono border"
          style={{ background: '#1a0a0a', borderColor: '#f43f5e55', color: '#f87171' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading Spinner ──────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.cyan }} />
          <span className="text-xs text-slate-500 font-mono">Aggregating data…</span>
        </div>
      )}

      {/* ── Main Analytics ───────────────────────────────────── */}
      {stats && eventMeta && !loading && (
        <div className="space-y-6">

          {/* Event badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border"
            style={{ borderColor: '#00d4ff33', color: '#00d4ff', background: '#00d4ff0d' }}
          >
            <Zap className="w-3 h-3" />
            {eventMeta.title}
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              Capacity {stats.capacityUsedPercent}% filled
            </span>
          </div>

          {/* ── KPI Row ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={Users}
              label="Total Registrations"
              value={stats.totalConfirmedRegistrations.toLocaleString('en-IN')}
              sub={`of ${eventMeta.maxCapacity.toLocaleString('en-IN')} seats`}
              accent={COLORS.cyan}
            />
            <KpiCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${stats.totalRevenueInr.toLocaleString('en-IN')}`}
              sub={`Member ₹${eventMeta.memberFee} · Non-Member ₹${eventMeta.standardFee}`}
              accent={COLORS.green}
            />
            <KpiCard
              icon={TrendingUp}
              label="Capacity Filled"
              value={`${stats.capacityUsedPercent}%`}
              sub={`${stats.byPaymentMethod.online} online · ${stats.byPaymentMethod.cash} cash`}
              accent={COLORS.amber}
            />
          </div>

          {/* ── Pie Charts Row ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Payment Method: Online vs Cash">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={COLORS.cyan} />
                    <Cell fill={COLORS.rose} />
                  </Pie>
                  <Tooltip content={<CyberTooltip />} />
                  <Legend
                    formatter={(val) => (
                      <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Registrant Tier: Member vs Non-Member">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tierPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={COLORS.violet} />
                    <Cell fill={COLORS.amber} />
                  </Pie>
                  <Tooltip content={<CyberTooltip />} />
                  <Legend
                    formatter={(val) => (
                      <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>

          {/* ── Revenue by Tier Bar ──────────────────────────── */}
          <Section title="Revenue Breakdown by Tier (₹ INR)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueBarData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CyberTooltip prefix="₹" />} />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.green} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Registrations Over Time ──────────────────────── */}
          {stats.registrationsOverTime.length > 0 && (
            <Section title="Registrations Over Time (confirmed, by day)">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={stats.registrationsOverTime}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.cyan} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CyberTooltip suffix=" reg." />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke={COLORS.cyan}
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                    dot={{ fill: COLORS.cyan, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: COLORS.cyan }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Section>
          )}

          {/* ── Zero-data guard for time chart ──────────────── */}
          {stats.registrationsOverTime.length === 0 && (
            <Section title="Registrations Over Time">
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-600">
                <BarChart2 className="w-6 h-6" />
                <span className="text-xs font-mono">No confirmed registrations yet for this event.</span>
              </div>
            </Section>
          )}

        </div>
      )}
    </div>
  );
};

export default TreasurerDashboard;

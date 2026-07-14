import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, IndianRupee, Users, Zap, ChevronDown,
  Loader2, AlertTriangle, BarChart2, ArrowLeft,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import ConstellationBackground from '../components/ui/ConstellationBackground';

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
      className="px-4 py-3 rounded-xl text-xs font-mono backdrop-blur-md shadow-xl"
      style={{ 
        background: 'rgba(13, 17, 23, 0.85)', 
        borderColor: '#00d4ff60', 
        borderWidth: '1px',
        color: '#e2e8f0',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)'
      }}
    >
      {label && <p className="mb-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] pb-2 border-b border-slate-700/50">{label}</p>}
      <div className="flex flex-col gap-1.5">
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2 font-bold" style={{ color: entry.color || COLORS.cyan }}>
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color || COLORS.cyan }}></span>
            {entry.name}: {prefix}{entry.value?.toLocaleString('en-IN')}{suffix}
          </p>
        ))}
      </div>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent = COLORS.cyan }) => (
  <div
    className="rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
    style={{ 
      background: 'rgba(13, 17, 23, 0.7)', 
      backdropFilter: 'blur(12px)',
      border: `1px solid ${accent}40`,
      boxShadow: `0 8px 32px -8px ${accent}20, inset 0 0 16px ${accent}10`
    }}
  >
    {/* Glowing orb in the background */}
    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl transition-all duration-500 group-hover:opacity-40" style={{ background: accent }}></div>
    
    <div className="flex items-center gap-3 relative z-10">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
        style={{ background: `${accent}15`, border: `1px solid ${accent}50`, boxShadow: `0 0 10px ${accent}30` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <span className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold">{label}</span>
    </div>
    <div className="flex flex-col gap-1 relative z-10 mt-2">
      <span
        className="text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight"
        style={{ color: accent, textShadow: `0 0 20px ${accent}60` }}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-slate-500 font-mono mt-1 font-semibold">{sub}</span>}
    </div>
  </div>
);

// ── Chart Section Wrapper ─────────────────────────────────────
const Section = ({ title, children }) => (
  <div
    className="rounded-2xl p-6 relative overflow-hidden"
    style={{ 
      background: 'rgba(13, 17, 23, 0.6)', 
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 212, 255, 0.1)',
      boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)'
    }}
  >
    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #00d4ff00, #00d4ff40, #00d4ff00)' }}></div>
    <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-slate-400 mb-6 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
      {title}
    </h3>
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all events for the selector dropdown, sorted newest first
  useEffect(() => {
    api.get('/admin/events')
      .then(({ data }) => {
        const sorted = (data.data || []).sort(
          (a, b) => new Date(b.eventDate) - new Date(a.eventDate)
        );
        setEvents(sorted);
        if (sorted.length) setSelectedId(sorted[0]._id);
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
      className="min-h-screen px-4 pb-16 relative"
      style={{ 
        backgroundColor: '#0B0F19', 
        fontFamily: "'JetBrains Mono', monospace" 
      }}
    >
      <ConstellationBackground />
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pt-8 pb-6 border-b mb-8 relative z-10" style={{ borderColor: '#ffffff0f' }}>
        <div className="flex items-center gap-3 mb-1">
          <Link to="/ops" className="flex items-center gap-1 text-xs uppercase tracking-widest font-mono text-slate-500 hover:text-white transition-colors mr-2">
            <ArrowLeft className="w-4 h-4" /> Ops Hub
          </Link>
          <BarChart2 className="w-5 h-5" style={{ color: COLORS.cyan }} />
          <span
            className="text-xs uppercase tracking-widest font-mono font-bold"
            style={{ color: COLORS.cyan }}
          >
            Treasurer Analytics
          </span>
        </div>
        <h1
          className="text-4xl sm:text-5xl font-black tracking-tight mt-2 mb-1"
          style={{
            background: `linear-gradient(to right, #ffffff, ${COLORS.cyan})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 40px ${COLORS.cyan}40`
          }}
        >
          Financial Intelligence
        </h1>
      </div>

      {/* ── Event Selector ──────────────────────────────────── */}
      <div className="mb-8 relative z-50">
        <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2 font-mono">
          Select Event
        </label>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
          </div>
        ) : (
          <div className="relative inline-block w-full max-w-md group">
            {/* Custom Dropdown Trigger */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full relative rounded-xl px-5 py-3.5 pr-12 text-sm font-mono font-bold cursor-pointer transition-all duration-300 flex items-center justify-between"
              style={{
                background: 'rgba(13, 17, 23, 0.7)',
                backdropFilter: 'blur(12px)',
                borderColor: isDropdownOpen ? '#00d4ff80' : '#00d4ff40',
                borderWidth: '1px',
                color: '#00d4ff',
                boxShadow: isDropdownOpen 
                  ? '0 4px 20px -5px rgba(0, 212, 255, 0.3), inset 0 0 15px rgba(0, 212, 255, 0.1)' 
                  : '0 4px 20px -5px rgba(0, 212, 255, 0.15), inset 0 0 10px rgba(0, 212, 255, 0.05)',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.4)'
              }}
            >
              <span className="truncate">
                {events.find(ev => ev._id === selectedId)?.title || 'Select Event'}
              </span>
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-6 h-6 rounded flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: isDropdownOpen ? 'rgba(0, 212, 255, 0.25)' : 'rgba(0, 212, 255, 0.15)', 
                  border: isDropdownOpen ? '1px solid rgba(0, 212, 255, 0.6)' : '1px solid rgba(0, 212, 255, 0.4)',
                  transform: isDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)'
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" style={{ color: COLORS.cyan }} />
              </div>
              {/* Glowing side accent */}
              <div className="absolute top-1/2 -left-[1px] w-[3px] h-6 -translate-y-1/2 bg-cyan-400 rounded-full shadow-[0_0_12px_#00d4ff]"></div>
            </div>

            {/* Custom Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Invisible backdrop to catch outside clicks */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                
                <div 
                  className="absolute top-[calc(100%+8px)] left-0 w-full z-50 rounded-xl overflow-hidden backdrop-blur-xl transition-all"
                  style={{
                    background: 'rgba(13, 17, 23, 0.9)',
                    borderColor: '#00d4ff40',
                    borderWidth: '1px',
                    boxShadow: '0 10px 40px -10px rgba(0, 212, 255, 0.2), 0 0 20px -5px rgba(0,0,0,0.5)'
                  }}
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {events.map((ev) => {
                      const isSelected = selectedId === ev._id;
                      return (
                        <div
                          key={ev._id}
                          onClick={() => { setSelectedId(ev._id); setIsDropdownOpen(false); }}
                          className="px-5 py-3.5 text-sm font-mono cursor-pointer transition-colors duration-200"
                          style={{
                            color: isSelected ? '#00d4ff' : '#94a3b8',
                            background: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                            borderLeft: isSelected ? '3px solid #00d4ff' : '3px solid transparent',
                            fontWeight: isSelected ? 'bold' : 'normal'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.04)';
                              e.currentTarget.style.color = '#cbd5e1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#94a3b8';
                            }
                          }}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Error State ─────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm font-mono border relative z-10"
          style={{ background: '#1a0a0a', borderColor: '#f43f5e55', color: '#f87171' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading Spinner ──────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 relative z-10">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.cyan }} />
          <span className="text-xs text-slate-500 font-mono">Aggregating data…</span>
        </div>
      )}

      {/* ── Main Analytics ───────────────────────────────────── */}
      {stats && eventMeta && !loading && (
        <div className="space-y-6 relative z-10">

          {/* Event badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border"
            style={{ borderColor: '#00d4ff33', color: '#00d4ff', background: '#00d4ff0d' }}
          >
            <Zap className="w-3 h-3" />
            {eventMeta.title}
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              {eventMeta.maxCapacity ? `Capacity ${stats.capacityUsedPercent}% filled` : 'Unlimited Capacity'}
            </span>
          </div>

          {/* ── KPI Row ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={Users}
              label="Total Registrations"
              value={stats.totalConfirmedRegistrations.toLocaleString('en-IN')}
              sub={eventMeta.maxCapacity ? `of ${eventMeta.maxCapacity.toLocaleString('en-IN')} seats` : 'Unlimited seats'}
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
          {/* ── Offline Registrations by Agent Data Table ──────── */}
          {stats.cashRegistrationsByAgent && stats.cashRegistrationsByAgent.length > 0 && (
            <Section title="Offline Registrations by Agent">
              <div className="overflow-x-auto rounded-xl border border-[#ffffff0a] mt-2">
                <table className="w-full text-left text-sm font-mono text-slate-300">
                  <thead className="bg-[#121826] text-slate-400 text-xs uppercase tracking-widest border-b border-[#ffffff0a]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agent Name</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium text-right">Registrations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffffff0a]">
                    {stats.cashRegistrationsByAgent.map((agent, i) => (
                      <tr key={i} className="hover:bg-[#ffffff05] transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{agent.name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] uppercase">
                            {agent.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-cyan-400 text-right">{agent.count.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

        </div>
      )}
    </div>
  );
};

export default TreasurerDashboard;

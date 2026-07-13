import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ScanLine, Search, CheckCircle2, Clock, Users, Loader2,
  ArrowLeft, MapPin, CalendarDays, CheckCheck, AlertTriangle,
  UserCheck, X
} from 'lucide-react';
import api from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', {
  hour: '2-digit', minute: '2-digit',
});

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bg, border }) => (
  <div
    className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl transition-all"
    style={{ background: bg, border: `1px solid ${border}` }}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
    <span className="text-3xl font-black text-white">{value}</span>
  </div>
);

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const styles = {
    success: { bg: 'rgba(6,78,59,0.95)', border: 'rgba(52,211,153,0.3)', color: '#6ee7b7' },
    error:   { bg: 'rgba(69,10,10,0.95)',  border: 'rgba(248,113,113,0.3)', color: '#fca5a5' },
    warn:    { bg: 'rgba(78,52,6,0.95)',   border: 'rgba(245,158,11,0.3)', color: '#fcd34d' },
  };
  const s = styles[toast.type] || styles.success;
  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: 'blur(16px)', color: s.color }}>
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {toast.message}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// EVENT CONTROL ROOM
// ─────────────────────────────────────────────────────────────
const EventControlRoom = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event,   setEvent]   = useState(null);
  const [stats,   setStats]   = useState({ total: 0, checkedIn: 0, pending: 0 });
  const [roster,  setRoster]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [manualingId, setManualingId] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRoster = useCallback(async () => {
    try {
      const res = await api.get(`/ops/events/${eventId}/roster`);
      setEvent(res.data.event);
      setStats(res.data.stats);
      setRoster(res.data.data || []);
    } catch (err) {
      setError('Failed to load roster. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  // ── Manual Check-In ───────────────────────────────────────
  const handleManualCheckIn = async (registration) => {
    if (manualingId) return;
    setManualingId(registration._id);
    try {
      await api.put(`/ops/events/${eventId}/checkin`, { registrationId: registration._id });

      // Optimistic update
      setRoster(prev =>
        prev.map(r =>
          r._id === registration._id
            ? { ...r, checkedIn: true, checkedInAt: new Date().toISOString() }
            : r
        )
      );
      setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1, pending: prev.pending - 1 }));
      showToast(`${registration.name} checked in!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed.';
      showToast(msg === 'ALREADY_SCANNED' ? 'Already checked in.' : msg, 'error');
    } finally {
      setManualingId(null);
    }
  };

  // ── Client-side Search Filter ─────────────────────────────
  const filtered = roster.filter(r => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.name?.toLowerCase().includes(q) ||
      r.userId?.registrationNumber?.toLowerCase().includes(q) ||
      r.userId?.aceId?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Toast toast={toast} />

      {/* ── Back + Event Header ───────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/ops')}
          className="flex items-center gap-2 text-sm text-neutral-400 font-medium mb-4 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {event?.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
          {event?.eventDate && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <CalendarDays className="w-3.5 h-3.5" />
              {fmtDate(event.eventDate)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              {event.venue}
            </span>
          )}
        </div>
      </div>

      {/* ── Real-Time Stats ───────────────────────────────── */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Users}
          color="#818cf8"
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.1)"
        />
        <StatCard
          label="Checked In"
          value={stats.checkedIn}
          icon={CheckCheck}
          color="#34d399"
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.1)"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="#fb923c"
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.1)"
        />
      </div>

      {/* ── Launch Scanner CTA ────────────────────────────── */}
      <button
        onClick={() => navigate('/ops/scan', { state: { mode: 'checkin', eventId, eventTitle: event?.title } })}
        className="group w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300 hover:scale-[1.005] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.99] border border-white/20"
        style={{ background: '#ffffff' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <ScanLine className="w-6 h-6 text-black" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-black">Launch QR Scanner</p>
            <p className="text-sm text-neutral-600">Scan member QR codes to check them in</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
          <ScanLine className="w-4 h-4 text-black" />
        </div>
      </button>

      {/* ── Roster Table ──────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#151515',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Sticky Search */}
        <div className="p-4 border-b border-white/10 sticky top-0 bg-[#151515]/90 backdrop-blur-sm z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, roll number, or ACE ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:border-white/30 transition-all font-mono placeholder:font-sans placeholder:text-neutral-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-mono text-neutral-500 mt-2">
            Showing {filtered.length} of {roster.length} registrants
          </p>
        </div>

        {/* Table — horizontally scrollable on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Roll No.</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">ACE ID</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tier</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-500 font-mono">
                    No results for "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => (
                  <tr key={reg._id} className={`transition-colors ${reg.checkedIn ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      {reg.checkedIn ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-emerald-700">Checked In</span>
                            {reg.checkedInAt && (
                              <p className="text-[10px] text-slate-400 font-mono">{fmtTime(reg.checkedInAt)}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-bold text-amber-600">Pending</span>
                        </div>
                      )}
                    </td>
                    {/* Name */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-white">{reg.name}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{reg.email}</p>
                    </td>
                    {/* Roll Number */}
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-mono text-neutral-300">
                        {reg.userId?.registrationNumber || '—'}
                      </span>
                    </td>
                    {/* ACE ID */}
                    <td className="px-5 py-4">
                      {reg.userId?.aceId ? (
                        <span className="text-[11px] font-mono font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md">
                          {reg.userId.aceId}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-600 font-mono">Guest</span>
                      )}
                    </td>
                    {/* Tier */}
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                        reg.tier === 'member'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-neutral-300 bg-white/5 border border-white/10'
                      }`}>
                        {reg.tier === 'member' ? 'Member' : 'Standard'}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {!reg.checkedIn ? (
                        <button
                          onClick={() => handleManualCheckIn(reg)}
                          disabled={!!manualingId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ml-auto hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 text-white"
                        >
                          {manualingId === reg._id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserCheck className="w-3.5 h-3.5" />
                          }
                          Check In
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-500">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventControlRoom;

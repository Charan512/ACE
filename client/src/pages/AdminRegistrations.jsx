import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Download,
} from 'lucide-react';
import api from '../lib/api';

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    confirmed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', label: 'Confirmed' },
    pending:   { cls: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-400 animate-pulse', label: 'Pending' },
    cancelled: { cls: 'bg-red-50 text-red-600 border-red-100', dot: 'bg-red-400', label: 'Cancelled' },
  };
  const s = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Tier Badge ────────────────────────────────────────────────
const TierBadge = ({ tier }) => (
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
    tier === 'member'
      ? 'bg-blue-50 text-blue-600 border border-blue-100'
      : 'bg-slate-100 text-slate-500 border border-slate-200'
  }`}>
    {tier === 'member' ? 'Member Rate' : 'Standard Rate'}
  </span>
);

// ── Format date ───────────────────────────────────────────────
const formatDateTime = (str) => {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─────────────────────────────────────────────────────────────
// ADMIN REGISTRATIONS PAGE
// ─────────────────────────────────────────────────────────────
const AdminRegistrations = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [paymentStats, setPaymentStats] = useState(null);
  const [csvDownloading, setCsvDownloading] = useState(false);

  // ── Fetch all events for dropdown ───────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = await api.get('/admin/events');
      const list = res.data.data || [];
      setEvents(list);
      if (list.length > 0) {
        setSelectedEventId(list[0]._id);
        setSelectedEventTitle(list[0].title);
      }
    } catch (err) {
      console.error('[AdminRegistrations] Events fetch failed:', err.message);
      setError('Failed to load events list.');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // ── Fetch registrations for selected event ───────────────
  const fetchRegistrations = useCallback(async (eventId) => {
    if (!eventId) return;
    try {
      setRegsLoading(true);
      setError(null);
      const res = await api.get(`/admin/registrations/${eventId}`);
      setRegistrations(res.data.data || []);
    } catch (err) {
      console.error('[AdminRegistrations] Regs fetch failed:', err.message);
      setError('Failed to load registrations for this event.');
      setRegistrations([]);
    } finally {
      setRegsLoading(false);
    }
  }, []);

  // ── Fetch payment stats (admin only) ────────────────────────
  const fetchPaymentStats = useCallback(async (eventId) => {
    try {
      const res = await api.get(`/admin/events/${eventId}/payment-stats`);
      setPaymentStats(res.data.data);
    } catch (err) {
      // If 403 (SBM/EBM), silently skip — stats panel won't show
      if (err.response?.status !== 403) console.error('[AdminRegistrations] Payment stats failed:', err.message);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
      fetchPaymentStats(selectedEventId);
    }
  }, [selectedEventId, fetchRegistrations, fetchPaymentStats]);

  const handleEventChange = (e) => {
    const id = e.target.value;
    const ev = events.find((ev) => ev._id === id);
    setSelectedEventId(id);
    setSelectedEventTitle(ev?.title || '');
    setSearch('');
    setPaymentStats(null);
  };

  // ── Download server-side attendance CSV ─────────────────────
  const downloadAttendanceCsv = async () => {
    if (!selectedEventId) return;
    setCsvDownloading(true);
    try {
      const res = await api.get(`/admin/events/${selectedEventId}/attendance-csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEventTitle.replace(/\s+/g, '_')}_Attendance.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[AdminRegistrations] CSV download failed:', err.message);
    } finally {
      setCsvDownloading(false);
    }
  };

  // ── Filter by search ──────────────────────────────────────
  const filtered = registrations.filter((r) => {
    const q = search.toLowerCase();
    const name = (r.name || r.userId?.name || '').toLowerCase();
    const phone = (r.phone || r.userId?.phone || '').toLowerCase();
    const email = (r.email || r.userId?.email || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  // ── Stats summary ─────────────────────────────────────────
  const confirmed = registrations.filter((r) => r.status === 'confirmed').length;
  const pending = registrations.filter((r) => r.status === 'pending').length;

  // ── Export to CSV ─────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filtered.length) return;
    
    const headers = ['Name', 'Phone', 'Email', 'ACE ID', 'Tier', 'Status', 'Registered At'];
    
    const rows = filtered.map(reg => {
      const name = reg.name || reg.userId?.name || '';
      const phone = reg.phone || reg.userId?.phone || '';
      const email = reg.email || reg.userId?.email || '';
      const aceId = reg.userId?.aceId || '';
      const tier = reg.tier || '';
      const status = reg.status || '';
      const date = formatDateTime(reg.createdAt);
      
      // Escape commas by wrapping in quotes
      return [name, phone, email, aceId, tier, status, date].map(val => `"${val}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedEventTitle.replace(/\\s+/g, '_')}_Registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse attendees by event
        </p>
      </div>

      {/* ── Event Selector ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1 w-full max-w-md">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Select Active Event
          </label>
          {eventsLoading ? (
            <div className="flex items-center gap-2 text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-red-500 font-semibold">No events found in the system.</p>
          ) : (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={handleEventChange}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} {ev.isActive ? '• LIVE' : '• Inactive'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
        
        {selectedEventId && !regsLoading && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Client-side CSV (registration data only) */}
            {filtered.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            {/* Server-side Attendance CSV (includes paymentMethod, checkedIn) */}
            <button
              onClick={downloadAttendanceCsv}
              disabled={csvDownloading}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Includes paymentMethod and check-in data"
            >
              {csvDownloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Attendance CSV
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Stats ───────────────────────────── */}
      {selectedEventId && !regsLoading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{registrations.length}</p>
              <p className="text-xs font-semibold text-slate-400">Total Registrations</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{confirmed}</p>
              <p className="text-xs font-semibold text-slate-400">Confirmed</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{pending}</p>
              <p className="text-xs font-semibold text-slate-400">Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* ── Registrations Table ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header with Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-700">
              {selectedEventTitle || 'Attendees'}
            </span>
            {!regsLoading && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            )}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 font-medium"
            />
          </div>
        </div>

        {regsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-semibold text-slate-400">Loading registrations...</span>
          </div>
        ) : !selectedEventId ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <ClipboardList className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">Select an event above to view its registrations.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">
              {search ? 'No results match your search.' : 'No registrations yet for this event.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ACE ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tier</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((reg, idx) => {
                  const nameDisplay = reg.name || reg.userId?.name || '—';
                  const phoneDisplay = reg.phone || reg.userId?.phone || '—';
                  const emailDisplay = reg.email || reg.userId?.email || '—';
                  const aceId = reg.userId?.aceId;

                  return (
                    <tr key={reg._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">{nameDisplay}</p>
                        {!reg.userId && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">GUEST</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">{phoneDisplay}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 max-w-[180px] truncate">{emailDisplay}</td>
                      <td className="px-5 py-4">
                        {aceId ? (
                          <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                            {aceId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4"><TierBadge tier={reg.tier} /></td>
                      <td className="px-5 py-4"><StatusBadge status={reg.status} /></td>
                      <td className="px-5 py-4 text-xs text-slate-400">{formatDateTime(reg.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrations;

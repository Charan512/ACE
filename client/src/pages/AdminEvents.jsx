import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Plus,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Tag,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border animate-slide-up
      ${isSuccess ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
    ${isActive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-100 text-slate-500 border-slate-200'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
    {isActive ? 'LIVE' : 'INACTIVE'}
  </span>
);

// ── Format date ───────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ── Create Event Modal ────────────────────────────────────────
const CreateEventModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    venue: '',
    memberFee: '',
    standardFee: '',
    maxCapacity: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const res = await api.post('/admin/events', {
        ...form,
        memberFee: Number(form.memberFee),
        standardFee: Number(form.standardFee),
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
      });
      onCreated(res.data.data);
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Create New Event</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Event Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium" placeholder="e.g. Prajwalan 2k26" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Describe the event..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Event Date *</label>
                <input type="datetime-local" name="eventDate" value={form.eventDate} onChange={handleChange} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Venue</label>
                <input name="venue" value={form.venue} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Main Auditorium" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Member Fee (₹) *</label>
                <input type="number" name="memberFee" value={form.memberFee} onChange={handleChange} required min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Standard Fee (₹) *</label>
                <input type="number" name="standardFee" value={form.standardFee} onChange={handleChange} required min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Max Capacity</label>
                <input type="number" name="maxCapacity" value={form.maxCapacity} onChange={handleChange} min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="∞" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ADMIN EVENTS PAGE
// ─────────────────────────────────────────────────────────────
const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // eventId being toggled
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/events');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('[AdminEvents] Fetch failed:', err.message);
      showToast('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleToggle = async (eventId) => {
    setToggling(eventId);
    try {
      const res = await api.patch(`/admin/events/${eventId}/toggle`);
      setEvents((prev) => prev.map((ev) => ev._id === eventId ? res.data.data : ev));
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Toggle failed.', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleEventCreated = (newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(`"${newEvent.title}" created successfully.`, 'success');
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <Toast toast={toast} />
      {showModal && (
        <CreateEventModal
          onClose={() => setShowModal(false)}
          onCreated={handleEventCreated}
        />
      )}

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Events</h1>
          <p className="text-sm text-slate-500 mt-1">{events.length} total events in system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-semibold text-slate-400">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No events found. Create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Venue</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fees</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Toggle Live</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{ev.title}</div>
                      {ev.tags?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="w-3 h-3 text-slate-300" />
                          <span className="text-xs text-slate-400 truncate">{ev.tags.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(ev.eventDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 max-w-[140px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{ev.venue || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-600">
                        <span className="text-emerald-600">₹{ev.memberFee}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-slate-500">₹{ev.standardFee}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Member / Standard</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {ev.registeredCount ?? 0}
                      {ev.maxCapacity ? ` / ${ev.maxCapacity}` : ' / ∞'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge isActive={ev.isActive} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggle(ev._id)}
                        disabled={toggling === ev._id}
                        className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50
                          hover:shadow-sm"
                        style={ev.isActive
                          ? { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }
                          : { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }
                        }
                      >
                        {toggling === ev._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : ev.isActive
                            ? <ToggleRight className="w-3.5 h-3.5" />
                            : <ToggleLeft className="w-3.5 h-3.5" />
                        }
                        {ev.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;

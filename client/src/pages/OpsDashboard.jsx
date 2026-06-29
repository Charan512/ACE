import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, CalendarDays, MapPin, Users, ChevronRight,
  Loader2, Zap, AlertTriangle, DollarSign, X, User, Mail, Phone, CheckCircle2,
} from 'lucide-react';
import api from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

// ── Cash Registration Modal ───────────────────────────────────
const CashRegModal = ({ event, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try {
      await api.post(`/ops/events/${event._id}/cash-register`, {
        name:          form.name.trim(),
        email:         form.email.trim().toLowerCase(),
        phone:         form.phone.trim() || undefined,
        paymentMethod: 'cash',
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="clay-card clay-green p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Cash Registration</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{event.title}</p>
          </div>
          <button onClick={onClose} className="clay-btn clay-btn-ghost p-1.5 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="clay-icon-box w-14 h-14" style={{ background: '#d1fae5' }}>
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-800 text-center">Registered successfully!</p>
            <p className="text-xs text-slate-400 text-center">Admin has been notified. Entry recorded as Cash.</p>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={() => { setDone(false); setForm({ name: '', email: '', phone: '' }); }}
                className="clay-btn clay-btn-ghost flex-1 py-2.5 text-sm">
                Register Another
              </button>
              <button onClick={onClose}
                className="clay-btn clay-btn-dark flex-1 py-2.5 text-sm">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-3 clay-card clay-rose">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input required type="text" value={form.name} onChange={setField('name')}
                  placeholder="Attendee name" className="clay-input w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input required type="email" value={form.email} onChange={setField('email')}
                  placeholder="email@example.com" className="clay-input w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="tel" value={form.phone} onChange={setField('phone')}
                  placeholder="+91 98765 43210" className="clay-input w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl mt-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Payment Method: Cash</span>
              <span className="ml-auto text-xs font-mono font-black text-emerald-700">{String.fromCodePoint(0x20B9)}{event.standardFee}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="clay-btn clay-btn-ghost flex-1 py-2.5 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="clay-btn clay-btn-green flex-1 py-2.5 text-sm gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OPS DASHBOARD
// ─────────────────────────────────────────────────────────────
const OpsDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [cashRegEvent, setCashRegEvent] = useState(null); // event to cash-register for

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/ops/events');
        setEvents(res.data.data || []);
      } catch (err) {
        setError('Failed to load events. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Cash Reg Modal */}
      {cashRegEvent && (
        <CashRegModal event={cashRegEvent} onClose={() => setCashRegEvent(null)} />
      )}

      {/* ── Hero / Verify CTA ─────────────────────────────── */}
      <section>
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 mb-2">
          Operations Hub
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-6">
          What are you doing today?
        </h1>

        {/* Primary action — Verify Member */}
        <button
          onClick={() => navigate('/ops/scan', { state: { mode: 'verify' } })}
          className="group w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #ea580c, #f97316)',
            boxShadow: '0 8px 32px -4px rgba(234,88,12,0.35)',
          }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xl font-black text-white tracking-tight">Verify Member ID</p>
              <p className="text-sm text-orange-100 mt-0.5">Scan QR to confirm ACE membership</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
          or pick an event
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ── Active Events Feed ────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
            Active Events
          </p>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <CalendarDays className="w-8 h-8 text-slate-300 mb-1" />
            <p className="text-sm text-slate-400">No active events right now.</p>
            <p className="text-xs text-slate-300 font-mono">Check back later or create one in Admin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <button
                key={ev._id}
                onClick={() => navigate(`/ops/events/${ev._id}`)}
                className="clay-card clay-orange group w-full text-left flex items-center justify-between p-5 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="clay-icon-box w-11 h-11" style={{ background: '#ffedd5' }}>
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate group-hover:text-orange-700 transition-colors">
                      {ev.title}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <CalendarDays className="w-3 h-3" /> {fmtDate(ev.eventDate)}
                      </span>
                      {ev.venue && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <MapPin className="w-3 h-3" /> {ev.venue}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Users className="w-3 h-3" /> {ev.registeredCount || 0} registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCashRegEvent(ev); }}
                      className="clay-btn clay-btn-green hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1.5"
                      title="Cash Registration"
                    >
                      <DollarSign className="w-3 h-3" />
                      Cash Reg
                    </button>
                    <span className="clay-badge hidden sm:inline-flex" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}>
                      Open Control Room
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OpsDashboard;

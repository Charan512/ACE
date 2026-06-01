import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, CalendarDays, MapPin, Users, ChevronRight,
  Loader2, Zap, AlertTriangle
} from 'lucide-react';
import api from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

// ─────────────────────────────────────────────────────────────
// OPS DASHBOARD
// ─────────────────────────────────────────────────────────────
const OpsDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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
                className="group w-full text-left flex items-center justify-between p-5 rounded-2xl transition-all duration-200 hover:shadow-md active:scale-[0.99]"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Event icon accent */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.15)' }}>
                    <Zap className="w-5 h-5" style={{ color: '#ea580c' }} />
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
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg text-orange-600 bg-orange-50 border border-orange-100">
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, CalendarDays, MapPin, Users, ChevronRight,
  Loader2, Zap, AlertTriangle, DollarSign, X, User, Mail, Phone, CheckCircle2, UserPlus,
} from 'lucide-react';
import api from '../lib/api';

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

// ── Cash Registration Modal ───────────────────────────────────
const CashRegModal = ({ event, onClose }) => {
  const [tab, setTab] = useState('member'); // 'member' | 'guest'
  
  // Guest Form State
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '', year: '' });
  
  // Member Form State
  const [memberForm, setMemberForm] = useState({ identifier: '' }); // aceId or phone

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const setGuestField = (k) => (e) => setGuestForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try {
      if (tab === 'member') {
        const idVal = memberForm.identifier.trim();
        const payload = idVal.toLowerCase().startsWith('26ace') 
          ? { aceId: idVal } 
          : { phone: idVal };
          
        await api.post(`/ops/events/${event._id}/cash-register/member`, payload);
      } else {
        await api.post(`/ops/events/${event._id}/cash-register/guest`, {
          name:          guestForm.name.trim(),
          email:         guestForm.email.trim().toLowerCase(),
          phone:         guestForm.phone.trim() || undefined,
          year:          guestForm.year,
          paymentMethod: 'cash',
        });
      }
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDone(false);
    setGuestForm({ name: '', email: '', phone: '', year: '' });
    setMemberForm({ identifier: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-white">Cash Registration</h2>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[200px]">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-bold text-white text-center">Registered successfully!</p>
            <p className="text-xs text-neutral-400 text-center">Admin has been notified. Entry recorded as Cash.</p>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={resetForm}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors">
                Register Another
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 text-sm font-bold bg-white text-black hover:bg-neutral-200 rounded-xl transition-colors">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex p-1 bg-[#151515] border border-white/5 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => { setTab('member'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'member' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'
                }`}
              >
                ACE Member
              </button>
              <button
                type="button"
                onClick={() => { setTab('guest'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  tab === 'guest' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white'
                }`}
              >
                Guest
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-400">{error}</p>
                </div>
              )}
              
              {tab === 'member' ? (
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">Member Identifier <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input required type="text" value={memberForm.identifier} onChange={(e) => setMemberForm({ identifier: e.target.value })}
                      placeholder="ACE ID or Phone Number" className="w-full bg-[#151515] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30" />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      <input required type="text" value={guestForm.name} onChange={setGuestField('name')}
                        placeholder="Attendee name" className="w-full bg-[#151515] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      <input required type="email" value={guestForm.email} onChange={setGuestField('email')}
                        placeholder="email@example.com" className="w-full bg-[#151515] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5">Phone</label>
                      <input type="tel" value={guestForm.phone} onChange={setGuestField('phone')}
                        placeholder="Optional" className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5">Year <span className="text-red-500">*</span></label>
                      <select required value={guestForm.year} onChange={setGuestField('year')}
                        className="w-full bg-[#151515] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 appearance-none">
                        <option value="" disabled>Select</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl mt-1">
                <DollarSign className="w-4 h-4 text-neutral-300" />
                <span className="text-xs font-bold text-neutral-300">Payment Method: Cash</span>
                <span className="ml-auto text-xs font-mono font-black text-white">{String.fromCodePoint(0x20B9)}{tab === 'member' ? event.memberFee : event.standardFee}</span>
              </div>
              
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 text-sm font-bold text-black bg-white hover:bg-neutral-200 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ── Cash Membership Modal ─────────────────────────────────────
const CashMembershipModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', branch: '', year: '', gender: '', collegeId: '' });
  const [membershipFee, setMembershipFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { aceId, name, email }
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch current membership fee from DB — never use a hardcoded fallback
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/settings/membership-fee`)
      .then(r => r.json())
      .then(d => {
        if (d.success && typeof d.data?.membershipFee === 'number') {
          setMembershipFee(d.data.membershipFee);
        } else {
          setError('Could not load membership fee. Please close and try again.');
        }
      })
      .catch(() => setError('Could not load membership fee. Please close and try again.'));
  }, []);

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const res = await api.post('/ops/cash-membership', {
        name:      form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim() || undefined,
        branch:    form.branch.trim() || undefined,
        year:      form.year ? Number(form.year) : undefined,
        gender:    form.gender || undefined,
        collegeId: form.collegeId.trim() || undefined,
      });
      setDone(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inCls = 'w-full bg-[#151515] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0A0A0A] rounded-3xl shadow-2xl border border-white/10 w-full max-w-md my-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">New ACE Member</h2>
              <p className="text-[11px] text-neutral-500 font-mono">
                Cash payment — Fee: {membershipFee !== null ? `₹${membershipFee}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <p className="text-base font-black text-white">{done.name} registered!</p>
              <p className="text-2xl font-mono font-black text-white">{done.aceId}</p>
              <p className="text-xs text-neutral-400">Credentials and confirmation email sent to {done.email}</p>
              <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-colors">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name *</label>
                  <input required type="text" placeholder="Priya Sharma" value={form.name} onChange={setField('name')} className={inCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email *</label>
                  <input required type="email" placeholder="priya@example.com" value={form.email} onChange={setField('email')} className={inCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone *</label>
                  <input required type="tel" placeholder="9876543210" value={form.phone} onChange={setField('phone')} className={inCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Year *</label>
                  <select required value={form.year} onChange={setField('year')} className={inCls}>
                    <option value="" disabled>Select</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Branch *</label>
                  <select required value={form.branch} onChange={setField('branch')} className={inCls}>
                    <option value="" disabled>Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSBS">CSBS</option>
                    <option value="CSD">CSD</option>
                    <option value="CIC">CIC</option>
                    <option value="IT">IT</option>
                    <option value="CSIT">CSIT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Gender *</label>
                  <select required value={form.gender} onChange={setField('gender')} className={inCls}>
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">College ID / Roll No.</label>
                  <input type="text" placeholder="22B91A0501" value={form.collegeId} onChange={setField('collegeId')} className={inCls} />
                </div>
              </div>
              <button type="submit" disabled={loading || membershipFee === null}
                className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading
                  ? 'Registering...'
                  : membershipFee === null
                    ? 'Loading fee...'
                    : `Register as Member — ₹${membershipFee} Cash`
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const OpsDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [cashRegEvent, setCashRegEvent] = useState(null); // event to cash-register for
  const [showMemberModal, setShowMemberModal] = useState(false);

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

      {/* Cash Membership Modal */}
      {showMemberModal && (
        <CashMembershipModal onClose={() => setShowMemberModal(false)} />
      )}

      {/* ── Hero / Verify CTA ─────────────────────────────── */}
      <section>
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Operations Hub
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-neutral-400 text-transparent bg-clip-text">
          What are you doing today?
        </h1>

        {/* Primary action — Verify Member */}
        <button
          onClick={() => navigate('/ops/scan', { state: { mode: 'verify' } })}
          className="group w-full flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] bg-[#151515] border border-white/10 hover:border-white/20 hover:bg-[#222] mb-3"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-300">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xl font-black text-white tracking-tight">Verify Member ID</p>
              <p className="text-sm text-neutral-400 mt-0.5">Scan QR to confirm ACE membership</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        {/* Secondary action — Register New Member (cash) */}
        <button
          onClick={() => setShowMemberModal(true)}
          className="group w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-200 bg-[#151515] border border-white/10 hover:border-white/20 hover:bg-[#222]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-base font-black text-white">Register New Member</p>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">Walk-in · Cash payment</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </section>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">
          or pick an event
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* ── Active Events Feed ────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500">
            Active Events
          </p>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <CalendarDays className="w-8 h-8 text-neutral-600 mb-1" />
            <p className="text-sm text-neutral-400">No active events right now.</p>
            <p className="text-xs text-neutral-500 font-mono">Check back later or create one in Admin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div
                key={ev._id}
                onClick={() => navigate(`/ops/events/${ev._id}`)}
                className="bg-[#151515] border border-white/10 rounded-2xl group w-full text-left flex items-center justify-between p-5 hover:border-white/20 hover:bg-[#222] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">
                      {ev.title}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                        <CalendarDays className="w-3 h-3" /> {fmtDate(ev.eventDate)}
                      </span>
                      {ev.venue && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                          <MapPin className="w-3 h-3" /> {ev.venue}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                        <Users className="w-3 h-3" /> {ev.registeredCount || 0} registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCashRegEvent(ev); }}
                      className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1.5 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
                      title="Cash Registration"
                    >
                      <DollarSign className="w-3 h-3" />
                      Cash Reg
                    </button>
                    <span className="hidden sm:inline-flex bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1.5 text-[10px] font-mono font-bold">
                      Open Control Room
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OpsDashboard;

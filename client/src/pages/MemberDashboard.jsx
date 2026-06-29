import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import BlurText from '../components/react-bits/BlurText';
import {
  CheckCircle, XCircle, Loader2,
  AlertTriangle, CalendarDays, Award, X, Zap,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div
      className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-start gap-3 max-w-sm p-4 rounded-2xl shadow-2xl"
      style={{
        background: ok ? 'rgba(6,78,59,0.95)' : 'rgba(69,10,10,0.95)',
        border: ok ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {ok
        ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
        : <XCircle    className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
      }
      <p className="text-sm font-medium leading-snug" style={{ color: ok ? '#6ee7b7' : '#fca5a5' }}>
        {toast.message}
      </p>
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-5">
    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </p>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);

// ── Smart Fast-Pass Modal ──────────────────────────────────────
// Only shown when an event has customFormFields that the admin requires.
// Members only fill these event-specific questions — name, email, and ID
// are pulled automatically from their profile.
const SmartFastPassModal = ({ event, onSubmit, onCancel, isSubmitting }) => {
  const [responses, setResponses] = useState(() => {
    const init = {};
    event.customFormFields?.forEach(f => { init[f.fieldName] = ''; });
    return init;
  });

  const handleChange = (fieldName, value) => {
    setResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(responses);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Smart Fast-Pass</p>
              <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[220px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 font-medium">
            This event requires a few extra details. Your name, email, and member ID are already pre-filled.
          </p>

          {event.customFormFields?.map((field) => (
            <div key={field.fieldName}>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {field.fieldName}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.fieldType === 'select' ? (
                <select
                  value={responses[field.fieldName]}
                  onChange={e => handleChange(field.fieldName, e.target.value)}
                  required={field.required}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Select an option...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.fieldType === 'radio' ? (
                <div className="flex flex-wrap gap-2">
                  {field.options?.map(opt => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                        responses[field.fieldName] === opt
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.fieldName}
                        value={opt}
                        checked={responses[field.fieldName] === opt}
                        onChange={() => handleChange(field.fieldName, opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={field.fieldType === 'number' ? 'number' : 'text'}
                  value={responses[field.fieldName]}
                  onChange={e => handleChange(field.fieldName, e.target.value)}
                  required={field.required}
                  placeholder={`Enter ${field.fieldName}…`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Zap className="w-4 h-4" />
              }
              {isSubmitting ? 'Processing…' : 'Proceed to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MEMBER DASHBOARD
// Smart Fast-Pass: 1-click for standard events, modal only when
// an event's customFormFields need answers that aren't in the profile.
// ─────────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user } = useAuthStore();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [registeringId, setRegisteringId]   = useState(null);
  const [toast, setToast]                   = useState(null);

  // Profile completeness state
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  // Smart Fast-Pass modal state
  const [fastPassEvent, setFastPassEvent]   = useState(null);

  const isProfileComplete = () => {
    const requiredFields = ['name', 'phone', 'gender', 'branch', 'section', 'year', 'registrationNumber'];
    return requiredFields.every(field => Boolean(user?.[field]));
  };

  const getProfilePayload = () => {
    return {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      gender: user?.gender,
      year: user?.year,
      branch: user?.branch,
      section: user?.section,
      registrationNumber: user?.registrationNumber
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVault = useCallback(async () => {
    try {
      const res = await api.get('/users/me/vault');
      setVaultEvents(res.data.data || []);
    } catch (err) {
      console.error('[Dashboard] Vault fetch failed:', err.message);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [eventsRes] = await Promise.all([api.get('/events'), fetchVault()]);
        setUpcomingEvents(eventsRes.data.data || []);
      } catch (err) {
        console.error('[Dashboard] Data fetch failed:', err.message);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, fetchVault]);

  // ── Core: create PhonePe order and redirect ───────────────
  const initiatePayment = async (eventId, customResponses = {}) => {
    try {
      const orderRes = await api.post('/payments/order', { eventId, customResponses });
      const { merchantTransactionId, redirectUrl } = orderRes.data.data;
      sessionStorage.setItem('ace_pending_txn', merchantTransactionId);
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('[Dashboard] Registration error:', err.message);
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
      setRegisteringId(null);
    }
  };

  // ── Smart Fast-Pass entry point ───────────────────────────
  // - Events with customFormFields → open modal first
  // - Events without customFormFields → direct 1-click payment
  const handleRegister = (eventId) => {
    if (registeringId) return;
    
    if (!isProfileComplete()) {
      setShowIncompleteModal(true);
      return;
    }

    const event = upcomingEvents.find(ev => ev._id === eventId);
    if (!event) return;

    setRegisteringId(eventId);

    if (event.customFormFields?.length > 0) {
      setFastPassEvent(event); // modal takes over; registeringId keeps button in loading state
    } else {
      initiatePayment(eventId, getProfilePayload());
    }
  };

  const handleModalSubmit = async (customResponses) => {
    if (!fastPassEvent) return;
    const eventId = fastPassEvent._id;
    setFastPassEvent(null);
    const combinedResponses = { ...getProfilePayload(), ...customResponses };
    await initiatePayment(eventId, combinedResponses);
  };

  const handleModalCancel = () => {
    setFastPassEvent(null);
    setRegisteringId(null);
  };

  // ── Greeting ──────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Member';

  // ── Derived stats ─────────────────────────────────────────
  const certsAvailable = vaultEvents.filter(v => v.hasCertificate).length;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">

        {/* ── Welcome Hero ──────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1 text-slate-500">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex">
                <BlurText text={`${firstName},`} delay={100} animateBy="words" direction="top" />
              </h1>
            </div>

            {/* Stats chips */}
            {!loading && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="clay-badge clay-indigo text-indigo-700">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" />
                  {vaultEvents.length} event{vaultEvents.length !== 1 ? 's' : ''}
                </span>
                {certsAvailable > 0 && (
                  <span className="clay-badge clay-green text-emerald-700">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    {certsAvailable} cert{certsAvailable !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Profile incomplete warning */}
          {!user?.registrationNumber && (
            <div className="clay-card clay-amber mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  Roll number missing — required for certificate generation.
                </p>
              </div>
              <a
                href="/member/profile"
                className="clay-btn clay-btn-amber text-xs font-mono font-semibold px-4 py-2 shrink-0"
              >
                Complete profile →
              </a>
            </div>
          )}
        </section>

        {/* ── Member Card ───────────────────────────────────── */}
        <section>
          <SectionLabel>Member Card</SectionLabel>
          {user && <DigitalIdCard user={user} />}
        </section>

        {/* ── Available Events ──────────────────────────────── */}
        <section>
          <SectionLabel>Available Events</SectionLabel>
          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4f5882' }} />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="clay-card clay-slate w-full flex flex-col items-center justify-center py-16 gap-2">
                <CalendarDays className="w-8 h-8 mb-1 text-slate-400" />
                <p className="text-sm text-slate-500">No events available right now.</p>
              </div>
            ) : (
              upcomingEvents.map((ev) => {
                const isRegistered = vaultEvents.some(v => v._id === ev._id);
                return (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    onRegister={handleRegister}
                    isRegistering={registeringId === ev._id}
                    isRegistered={isRegistered}
                  />
                );
              })
            )}
          </div>
        </section>

      </div>

      <Toast toast={toast} />

      {/* ── Smart Fast-Pass Modal ──────────────────────────── */}
      {fastPassEvent && (
        <SmartFastPassModal
          event={fastPassEvent}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
          isSubmitting={false}
        />
      )}

      {/* ── Incomplete Profile Modal ───────────────────────── */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative animate-in fade-in zoom-in duration-200 text-center">
            <button 
              onClick={() => setShowIncompleteModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-950 tracking-tight mb-2">Profile Incomplete</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Your profile is missing required information (like your Section or Roll Number). Please complete your profile before registering for events.
            </p>
            <Link 
              to="/member/profile" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Update Profile Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import BlurText from '../components/react-bits/BlurText';
import {
  CheckCircle, XCircle, Loader2,
  AlertTriangle, CalendarDays, Award, X, Zap, Sparkles,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 p-4 rounded-2xl glass-panel ${ok ? 'bg-indigo-500/20 border-indigo-400/50' : 'bg-rose-500/20 border-rose-400/50'}`}>
      {ok ? <CheckCircle className="w-5 h-5 shrink-0 text-indigo-600" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600" />}
      <p className={`text-sm font-bold uppercase tracking-widest leading-snug ${ok ? 'text-indigo-900' : 'text-rose-900'}`}>
        {toast.message}
      </p>
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-4 mb-6">
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 glass-badge px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-900/20">
      {children}
    </p>
    <div className="flex-1 h-[1px] bg-white/20" />
  </div>
);

// ── Smart Fast-Pass Modal ──────────────────────────────────────
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
    >
      <div className="bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-md p-0 overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Smart Fast-Pass</p>
              <p className="text-sm font-bold text-slate-100 leading-tight truncate max-w-[220px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onCancel} className="glass-btn bg-white/5 border-white/10 p-2 rounded-xl">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-indigo-300 glass-badge bg-indigo-500/10 border-indigo-500/20 rounded-xl px-3 py-2 font-bold uppercase tracking-wider text-center">
            Required details missing from profile.
          </p>

          {event.customFormFields?.map((field) => (
            <div key={field.fieldName}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2">
                {field.fieldName}
                {field.required && <span className="text-rose-400 ml-1">*</span>}
              </label>

              {field.fieldType === 'select' ? (
                <select
                  value={responses[field.fieldName]}
                  onChange={e => handleChange(field.fieldName, e.target.value)}
                  required={field.required}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Select an option...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.fieldType === 'radio' ? (
                <div className="flex flex-wrap gap-3">
                  {field.options?.map(opt => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                        responses[field.fieldName] === opt
                          ? 'glass-btn bg-indigo-500/20 text-indigo-200 border-indigo-500/30 shadow-md'
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              )}
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 text-sm font-bold uppercase tracking-widest text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 glass-btn bg-indigo-500/20 border-indigo-500/30 rounded-xl py-3 text-sm font-bold uppercase tracking-widest text-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-500/30"
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Zap className="w-4 h-4" />
              }
              {isSubmitting ? 'Processing' : 'Proceed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MEMBER DASHBOARD
// Glassmorphism redesign
// ─────────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user } = useAuthStore();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [registeringId, setRegisteringId]   = useState(null);
  const [toast, setToast]                   = useState(null);

  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
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
      setFastPassEvent(event);
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Member';

  const certsAvailable = vaultEvents.filter(v => v.hasCertificate).length;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12">

        {/* ── Welcome Hero ──────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 shadow-2xl p-6 sm:p-8 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-block glass-badge bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4">
                {greeting}
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold text-slate-100 tracking-tight leading-none flex">
                <BlurText text={`${firstName},`} delay={100} animateBy="words" direction="top" />
              </h1>
            </div>

            {/* Stats chips */}
            {!loading && (
              <div className="flex sm:flex-col items-start sm:items-end gap-3 relative z-10 mt-6 sm:mt-0">
                <span className="glass-badge bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-slate-200 inline-flex items-center shadow-sm">
                  <CalendarDays className="w-4 h-4 mr-2 text-indigo-400" />
                  {vaultEvents.length} event{vaultEvents.length !== 1 ? 's' : ''}
                </span>
                {certsAvailable > 0 && (
                  <span className="glass-badge bg-indigo-500/10 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-indigo-200 inline-flex items-center shadow-sm">
                    <Award className="w-4 h-4 mr-2 text-indigo-400" />
                    {certsAvailable} cert{certsAvailable !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
            
            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 text-white pointer-events-none select-none blur-[2px]">
              <Sparkles className="w-48 h-48 opacity-30" />
            </div>
          </div>

          {/* Profile incomplete warning — shows if ANY required field is missing */}
          {!isProfileComplete() && (
            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-6 shadow-xl relative overflow-hidden">
              {/* Amber glow */}
              <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-amber-500/20 p-3 rounded-full border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
                </div>
                <p className="text-sm font-bold text-amber-100 uppercase tracking-widest leading-snug">
                  Profile incomplete<br/><span className="text-xs font-medium text-amber-300">Required for event registration &amp; certificates</span>
                </p>
              </div>
              <Link
                to="/member/profile"
                className="glass-btn bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 text-amber-200 rounded-xl font-bold px-6 py-3 w-full sm:w-auto text-center uppercase tracking-widest shrink-0 transition-colors"
              >
                Complete profile
              </Link>
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
          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl w-full flex flex-col items-center justify-center py-16 gap-4 text-slate-300">
                <CalendarDays className="w-12 h-12 mb-2 text-indigo-400/80" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No events available right now.</p>
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

      {/* ── Smart Fast-Pass Modal ──────────────────── */}
      {fastPassEvent && (
        <SmartFastPassModal
          event={fastPassEvent}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
          isSubmitting={!!registeringId}
        />
      )}

      {/* ── Incomplete Profile Modal ───────────────────────── */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
          <div className="bg-[#0B0F19]/90 backdrop-blur-xl border border-amber-500/30 max-w-sm w-full p-8 relative rounded-3xl shadow-2xl text-center">
            <button 
              onClick={() => setShowIncompleteModal(false)}
              className="absolute top-4 right-4 glass-btn border-white/10 bg-white/5 p-2 rounded-xl text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-amber-100 tracking-tight mb-3">Profile Incomplete</h3>
            <p className="text-sm text-amber-200/80 mb-8 font-medium">
              Your profile is missing required information (like your Section or Roll Number). Please complete your profile before registering for events.
            </p>
            <a 
              href="/member/profile" 
              className="w-full glass-btn bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 rounded-xl py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-amber-200"
            >
              Update Profile Now
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;

import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import BlurText from '../components/react-bits/BlurText';
import SpotlightCard from '../components/react-bits/SpotlightCard';
import {
  Download, CheckCircle, XCircle, Loader2,
  AlertTriangle, CalendarDays, Award, Clock,
} from 'lucide-react';
import api from '../lib/api';

// ── Shared Styles ─────────────────────────────────────────────
const CARD = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  borderRadius: '16px',
};

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

// Removed CertButton as requested (certificates are now only in History)

// ─────────────────────────────────────────────────────────────
// MEMBER DASHBOARD
// All Fast-Pass Razorpay and certificate download logic preserved.
// ─────────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user } = useAuthStore();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [registeringId, setRegisteringId]   = useState(null);
  const [toast, setToast]                   = useState(null);

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

  // ── Razorpay Fast-Pass ────────────────────────────────────
  const handleRegister = async (eventId) => {
    if (registeringId) return;
    setRegisteringId(eventId);
    try {
      const orderRes = await api.post('/payments/order', { eventId });
      const { orderId, amount, keyId } = orderRes.data.data;

      if (import.meta.env.DEV) {
        await api.post('/payments/dev-confirm', { razorpayOrderId: orderId });
        await fetchVault();
        showToast('Dev mode: Registration confirmed and added to vault.', 'success');
        return;
      }

      await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency: 'INR',
          name: 'ACE',
          description: 'Event Registration',
          order_id: orderId,
          theme: { color: '#818cf8' },
          handler: async (response) => {
            await fetchVault();
            showToast('Payment successful. Registration confirmed.', 'success');
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              showToast('Payment cancelled.', 'error');
              resolve(null);
            },
          },
        };
        if (!window.Razorpay) { reject(new Error('Razorpay SDK not loaded.')); return; }
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          showToast(`Payment failed: ${resp.error.description}`, 'error');
          reject(new Error(resp.error.description));
        });
        rzp.open();
      });
    } catch (err) {
      console.error('[Dashboard] Registration error:', err.message);
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setRegisteringId(null);
    }
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
                <SpotlightCard className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-medium text-indigo-700 bg-indigo-50 border-indigo-100">
                  <CalendarDays className="w-4 h-4" />
                  {vaultEvents.length} event{vaultEvents.length !== 1 ? 's' : ''}
                </SpotlightCard>
                {certsAvailable > 0 && (
                  <SpotlightCard className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-medium text-emerald-700 bg-emerald-50 border-emerald-100">
                    <Award className="w-4 h-4" />
                    {certsAvailable} cert{certsAvailable !== 1 ? 's' : ''}
                  </SpotlightCard>
                )}
              </div>
            )}
          </div>

          {/* Profile incomplete warning */}
          {!user?.registrationNumber && (
            <div
              className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl"
              style={{ background: 'rgba(120,53,15,0.12)', border: '1px solid rgba(245,158,11,0.18)' }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#d97706' }} />
                <p className="text-sm font-medium" style={{ color: '#d97706' }}>
                  Roll number missing — required for certificate generation.
                </p>
              </div>
              <a
                href="/member/profile"
                className="text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-all shrink-0"
                style={{
                  color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.3)',
                  background: 'rgba(245,158,11,0.08)',
                }}
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
              <div
                className="w-full flex flex-col items-center justify-center py-16 rounded-2xl gap-2"
                style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
              >
                <CalendarDays className="w-8 h-8 mb-1" style={{ color: '#1e293b' }} />
                <p className="text-sm" style={{ color: '#475569' }}>No events available right now.</p>
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
    </div>
  );
};

export default MemberDashboard;

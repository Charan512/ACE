import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import {
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-start gap-3 max-w-sm p-4 rounded-xl shadow-2xl border backdrop-blur-md
        ${ok
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-400'
          : 'bg-red-950/90 border-red-800 text-red-400'
        }`}
    >
      {ok
        ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
        : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
};

// ── Section Header ────────────────────────────────────────────
const SectionHeader = ({ label }) => (
  <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-5">
    {label}
  </h2>
);

// ─────────────────────────────────────────────────────────────
// MEMBER DASHBOARD
// All Razorpay Fast-Pass and certificate download logic preserved.
// ─────────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user } = useAuthStore();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [registeringId, setRegisteringId]   = useState(null);
  const [downloadingId, setDownloadingId]   = useState(null);
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
      // 1. Create the order & transaction in DB first (for both dev and prod)
      const orderRes = await api.post('/payments/order', { eventId });
      const { orderId, amount, keyId } = orderRes.data.data;

      // 2. Dev mode bypass
      if (import.meta.env.DEV) {
        // In dev, simulate the webhook firing by hitting our dev-confirm endpoint
        await api.post('/payments/dev-confirm', { razorpayOrderId: orderId });
        await fetchVault(); // Refresh the Vault UI
        showToast('Dev mode: Registration confirmed and added to vault.', 'success');
        return;
      }

      // 3. Production: open Razorpay checkout modal
      await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency: 'INR',
          name: 'ACE',
          description: 'Event Registration',
          order_id: orderId,
          theme: { color: '#3b82f6' },
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

  // ── Certificate Download ──────────────────────────────────
  const handleDownloadCert = async (eventId, eventTitle) => {
    if (downloadingId) return;
    setDownloadingId(eventId);
    try {
      const response = await api.get(`/certificates/download/${eventId}`, { responseType: 'blob' });
      const safeTitle = (eventTitle || 'certificate')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const blobUrl = URL.createObjectURL(response.data);
      const anchor  = document.createElement('a');
      anchor.href     = blobUrl;
      anchor.download = `ACE_Certificate_${safeTitle}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
      showToast('Certificate downloaded.', 'success');
    } catch (err) {
      console.error('[Dashboard] Certificate download error:', err.message);
      showToast(
        err.response?.status === 403
          ? 'You are not eligible for a certificate for this event.'
          : 'Download failed. Please try again.',
        'error'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">

        {/* Profile incomplete warning */}
        {!user?.registrationNumber && (
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border"
            style={{ background: 'rgba(120,53,15,0.15)', borderColor: 'rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-400 font-medium">
                Roll number missing — required for certificate generation.
              </p>
            </div>
            <a
              href="/member/profile"
              className="text-xs font-mono font-semibold text-amber-400 border border-amber-500/30 hover:border-amber-500/60 px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Complete profile
            </a>
          </div>
        )}

        {/* Passport */}
        <section>
          <SectionHeader label="Member Card" />
          {user && <DigitalIdCard user={user} />}
        </section>

        {/* Events */}
        <section>
          <SectionHeader label="Events" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-xl gap-2">
                <p className="text-sm text-slate-500">No events available.</p>
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

        {/* Vault */}
        <section>
          <SectionHeader label="My Registrations" />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : vaultEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 border border-dashed border-slate-800 rounded-xl gap-2">
              <p className="text-sm text-slate-500">No registrations yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4 gap-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {ev.title}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-1.5">
                      {new Date(ev.eventDate).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    id={`download-cert-${ev._id}`}
                    onClick={() => handleDownloadCert(ev._id, ev.title)}
                    disabled={downloadingId === ev._id}
                    className="w-full flex items-center justify-between text-xs font-mono font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-600 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {downloadingId === ev._id ? (
                      <>
                        <span>Generating…</span>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Download certificate</span>
                        <Download className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <Toast toast={toast} />
    </div>
  );
};

export default MemberDashboard;

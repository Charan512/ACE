import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import { Download, ShieldCheck, CheckCircle, XCircle, Loader2, Calendar, TerminalSquare, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

// ─────────────────────────────────────────────────────────────
// TOAST — lightweight inline notification (no external lib needed)
// ─────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border transition-all backdrop-blur-md
        ${isSuccess
          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]'
          : 'bg-red-950/80 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.1)]'
        }`}
    >
      {isSuccess
        ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
        : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user, updateProfile } = useAuthStore();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents]       = useState([]);
  const [loading, setLoading]               = useState(true);

  // Per-event loading states to disable individual buttons while in-flight
  const [registeringId, setRegisteringId]   = useState(null); // eventId being registered
  const [downloadingId, setDownloadingId]   = useState(null); // eventId being downloaded

  // Inline toast state
  const [toast, setToast] = useState(null);

  // ── Helpers ─────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Data Fetching ────────────────────────────────────────
  const fetchVault = useCallback(async () => {
    try {
      const vaultResponse = await api.get('/users/me/vault');
      setVaultEvents(vaultResponse.data.data || []);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch vault:', err.message);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Parallel fetch — events list + member vault
        const [eventsResponse] = await Promise.all([
          api.get('/events'),
          fetchVault(),
        ]);
        setUpcomingEvents(eventsResponse.data.data || []);
      } catch (error) {
        console.error('[Dashboard] Failed to fetch dashboard data:', error.message);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, fetchVault]);

  // ── Event Registration ───────────────────────────────────
  const handleRegister = async (eventId) => {
    if (registeringId) return; // Prevent double-click
    setRegisteringId(eventId);

    try {
      if (import.meta.env.DEV) {
        // ── DEV BYPASS ─────────────────────────────────────
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showToast('[DEV MODE] Payment bypassed. Registration confirmed.', 'success');
        return;
      }

      // ── PROD: Create Razorpay order ─────────────────────
      const orderRes = await api.post('/payments/order', { eventId });
      const { orderId, amount, keyId } = orderRes.data.data;

      // ── Open Razorpay modal ─────────────────────────────
      await new Promise((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency: 'INR',
          name: 'SRKR ACE',
          description: 'Event Registration',
          order_id: orderId,
          theme: { color: '#3b82f6' }, // blue-500
          handler: async (response) => {
            // Payment succeeded — refresh vault so the new entry appears
            await fetchVault();
            showToast('Payment successful! Event added to your vault.', 'success');
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              showToast('Payment cancelled.', 'error');
              resolve(null); // Resolve (not reject) — cancellation is not an error
            },
          },
        };

        if (!window.Razorpay) {
          reject(new Error('Razorpay SDK not loaded. Check index.html.'));
          return;
        }

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          showToast(`Payment failed: ${resp.error.description}`, 'error');
          reject(new Error(resp.error.description));
        });
        rzp.open();
      });
    } catch (err) {
      console.error('[Dashboard] Registration error:', err.message);
      showToast(
        err.response?.data?.message || 'Registration failed. Please try again.',
        'error'
      );
    } finally {
      setRegisteringId(null);
    }
  };

  // ── Certificate Download ─────────────────────────────────
  const handleDownloadCert = async (eventId, eventTitle) => {
    if (downloadingId) return;
    setDownloadingId(eventId);

    try {
      const response = await api.get(`/certificates/download/${eventId}`, {
        responseType: 'blob',
      });

      const safeTitle = (eventTitle || 'certificate')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 50);

      const filename = `ACE_Certificate_${safeTitle}.png`;
      const blobUrl = URL.createObjectURL(response.data);
      const anchor  = document.createElement('a');
      anchor.href     = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(blobUrl);
      showToast('Certificate downloaded successfully.', 'success');
    } catch (err) {
      console.error('[Dashboard] Certificate download error:', err.message);
      const msg = err.response?.status === 403
        ? 'You are not eligible for a certificate for this event.'
        : 'Download failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className="pb-24 min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* Profile Incomplete Warning Banner - TERMINAL STYLE */}
        {(!user?.registrationNumber) && (
          <div className="bg-black/50 border border-amber-500/30 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_20px_rgba(245,158,11,0.05)] backdrop-blur-sm relative overflow-hidden group">
            {/* Subtle glow behind */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-amber-500 tracking-wider">SYSTEM_WARNING: PROFILE_INCOMPLETE</h3>
                <p className="text-xs text-amber-200/60 mt-1 max-w-md font-mono leading-relaxed">
                  &gt; Roll Number and academic parameters missing.<br/>
                  &gt; Required for accurate certificate generation.
                </p>
              </div>
            </div>
            <a href="/member/profile" className="relative z-10 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 px-5 py-2.5 rounded-lg transition-all shrink-0 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-2">
              INITIATE_UPDATE <span className="text-amber-500/50">_</span>
            </a>
          </div>
        )}

        {/* ── Section 1: Member Passport ───────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-mono font-bold tracking-widest text-white uppercase">
              Member_Passport
            </h1>
          </div>
          <DigitalIdCard
            user={user || { name: 'LOADING...', aceId: '26ACE0000', role: 'member', email: '' }}
          />
        </section>

        {/* ── Section 2: The Arena (Active Events) ────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
            <TerminalSquare className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-mono font-bold tracking-widest text-white uppercase">
              Active_Modules [Arena]
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-md border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-full bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-center py-16">
                <p className="text-sm text-slate-500 font-mono tracking-widest">
                  &gt; NO_ACTIVE_MODULES_FOUND
                </p>
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  onRegister={handleRegister}
                  isRegistering={registeringId === ev._id}
                />
              ))
            )}
          </div>
        </section>

        {/* ── Section 3: Event History (The Vault) ───────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-mono font-bold tracking-widest text-white uppercase">
              System_Vault [History]
            </h2>
          </div>
          {loading ? (
            <div className="flex h-40 items-center justify-center w-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : vaultEvents.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-center py-16 w-full">
              <p className="text-sm text-slate-500 font-mono tracking-widest">
                &gt; VAULT_EMPTY
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vaultEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 flex flex-col justify-between h-44 shadow-[0_0_0_rgba(37,99,235,0)] hover:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-16 h-16 text-blue-500" />
                  </div>
                  <div className="relative z-10">
                    <h3
                      className="font-bold text-white truncate group-hover:text-blue-400 transition-colors"
                      title={ev.title}
                    >
                      {ev.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-widest uppercase">
                      TS: {new Date(ev.eventDate).toISOString().slice(0, 10)}
                    </p>
                  </div>

                  <button
                    id={`download-cert-${ev._id}`}
                    onClick={() => handleDownloadCert(ev._id, ev.title)}
                    disabled={downloadingId === ev._id}
                    className="relative z-10 flex items-center justify-between text-xs font-mono font-bold text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full mt-4"
                  >
                    {downloadingId === ev._id ? (
                      <>
                        <span>&gt; GENERATING_</span>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>&gt; FETCH_CERT</span>
                        <Download className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Global Toast */}
      <Toast toast={toast} />
    </div>
  );
};

export default MemberDashboard;

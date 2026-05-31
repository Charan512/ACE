import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import { Download, ShieldCheck, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

// ─────────────────────────────────────────────────────────────
// TOAST — lightweight inline notification (no external lib needed)
// ─────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border transition-all
        ${isSuccess
          ? 'bg-slate-900 border-cyber-cyan/40 text-cyber-cyan'
          : 'bg-slate-900 border-red-500/40 text-red-400'
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

  // Profile Update State
  const [collegeIdInput, setCollegeIdInput] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!collegeIdInput.trim()) return;

    setIsSubmittingProfile(true);
    try {
      await updateProfile({ collegeId: collegeIdInput.trim() });
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error('[Dashboard] Profile update failed:', err.message);
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSubmittingProfile(false);
    }
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
  /**
   * Handles ticket purchase flow.
   *
   * DEV MODE (import.meta.env.DEV === true):
   *   Skips Razorpay entirely, simulates a 1-second delay, then shows a
   *   success banner. Useful for testing the dashboard without live Razorpay keys.
   *
   * PROD MODE:
   *   Creates a Razorpay order via POST /api/payments/order, then opens the
   *   Razorpay checkout modal. On payment success, refreshes the vault.
   */
  const handleRegister = async (eventId) => {
    if (registeringId) return; // Prevent double-click
    setRegisteringId(eventId);

    try {
      if (import.meta.env.DEV) {
        // ── DEV BYPASS ─────────────────────────────────────
        await new Promise((resolve) => setTimeout(resolve, 1000));
        showToast('[DEV MODE] Payment bypassed. Registration confirmed.', 'success');
        // In dev, we don't actually update the DB, so no vault refresh needed.
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
          theme: { color: '#00d4ff' },
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
  /**
   * Streams the PNG certificate from the backend and triggers a browser download.
   *
   * The backend generates it on-the-fly (zero-storage):
   *   GET /api/certificates/download/:eventId
   *
   * We receive a binary blob, wrap it in a temporary object URL, click a
   * synthetic anchor, then immediately revoke the URL to free memory.
   */
  const handleDownloadCert = async (eventId, eventTitle) => {
    if (downloadingId) return;
    setDownloadingId(eventId);

    try {
      const response = await api.get(`/certificates/download/${eventId}`, {
        responseType: 'blob',
      });

      // Build a safe filename from the event title
      const safeTitle = (eventTitle || 'certificate')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 50);

      const filename = `ACE_Certificate_${safeTitle}.png`;

      // Create a temporary object URL and trigger the download
      const blobUrl = URL.createObjectURL(response.data);
      const anchor  = document.createElement('a');
      anchor.href     = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Revoke the object URL immediately — frees the in-memory blob
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

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="pt-20 pb-24 min-h-screen bg-obsidian">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Profile Incomplete Warning Banner */}
        {(!user?.collegeId) && (
          <div className="bg-slate-900 border border-amber-500/40 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-500/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-lg font-black tracking-tight uppercase">Profile Incomplete</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Your profile is missing a **College ID / Roll Number**. Please update this to ensure your member identity and event credentials generate correctly.
              </p>
            </div>
            <form onSubmit={handleProfileUpdate} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <input
                id="dashboard-college-id"
                type="text"
                required
                className="bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none px-4 py-3 rounded-xl text-sm font-mono text-white placeholder:text-slate-600 min-w-[200px]"
                placeholder="Enter College ID"
                value={collegeIdInput}
                onChange={(e) => setCollegeIdInput(e.target.value)}
                disabled={isSubmittingProfile}
              />
              <button
                id="dashboard-update-profile-btn"
                type="submit"
                disabled={isSubmittingProfile}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-955" />
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Section 1: Member Passport ─────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-cyber-cyan" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              MEMBER PASSPORT
            </h1>
          </div>
          <DigitalIdCard
            user={user || { name: 'LOADING...', aceId: '26ACE0000', role: 'member', email: '' }}
          />
        </section>

        {/* ── Section 2: The Arena (Active Events) ────────── */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-6 border-b border-border-sharp pb-2">
            THE ARENA (ACTIVE EVENTS)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-full card-sharp text-center py-12 border-dashed border-border-sharp">
                <p className="text-lg text-text-primary font-bold tracking-wider">
                  NO UPCOMING EVENTS SCHEDULED RIGHT NOW
                </p>
                <p className="mt-2 text-text-muted font-data text-sm">
                  CHECK BACK SOON FOR UPDATES.
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

        {/* ── Section 3: The Vault (History & Certs) ──────── */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-6 border-b border-border-sharp pb-2">
            THE VAULT (HISTORY)
          </h2>
          {loading ? (
            <div className="flex h-40 items-center justify-center w-full">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent" />
            </div>
          ) : vaultEvents.length === 0 ? (
            <div className="card-sharp text-center py-12 border-dashed border-border-sharp w-full">
              <p className="text-lg text-text-primary font-bold tracking-wider">
                VAULT IS EMPTY
              </p>
              <p className="mt-2 text-text-muted font-data text-sm">
                ATTEND EVENTS TO UNLOCK SECURE CERTIFICATES.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vaultEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="card-sharp flex flex-col justify-between h-44 group hover:border-cyber-cyan transition-colors"
                >
                  <div>
                    <h3
                      className="font-bold text-text-primary truncate"
                      title={ev.title}
                    >
                      {ev.title}
                    </h3>
                    <p className="font-data text-xs text-text-muted mt-2">
                      {new Date(ev.eventDate).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    id={`download-cert-${ev._id}`}
                    onClick={() => handleDownloadCert(ev._id, ev.title)}
                    disabled={downloadingId === ev._id}
                    className="flex items-center justify-between text-sm font-bold text-cyber-cyan opacity-80 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {downloadingId === ev._id ? (
                      <>
                        <span>GENERATING...</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>DOWNLOAD CERT</span>
                        <Download className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Global Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
};

export default MemberDashboard;

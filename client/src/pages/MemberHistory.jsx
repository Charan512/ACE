import { useState, useEffect, useCallback } from 'react';
import {
  Download, Loader2, AlertTriangle, Calendar, Award,
  History, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import api from '../lib/api';
import BlurText from '../components/react-bits/BlurText';

// ── Shared Styles removed — using clay-card from index.css now

// ── Stat Block ────────────────────────────────────────────────
const StatBlock = ({ value, label, color = '#818cf8', clayColor = 'clay-indigo' }) => (
  <div className={`clay-card ${clayColor} flex-1 p-4 sm:p-5`}>
    <p className="text-2xl sm:text-3xl font-mono font-black" style={{ color }}>
      {value}
    </p>
    <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] mt-1.5 text-slate-500">
      {label}
    </p>
  </div>
);

// ── Certificate Cell ──────────────────────────────────────────
/**
 * Renders one of three states based on `hasCertificate`:
 *   false   → Amber "Not Released" badge
 *   true + downloading → Indigo spinner
 *   true + idle       → Indigo download button
 */
const CertCell = ({ ev, downloadingId, onDownload, mobile = false }) => {
  const isDownloading = downloadingId === ev._id;

  if (!ev.hasCertificate) {
    return (
      <span
        className={`clay-badge clay-amber text-amber-700 whitespace-nowrap ${mobile ? 'w-full justify-center' : ''}`}
        title="The admin has not released a certificate for this event yet."
      >
        <Clock className="w-3 h-3 shrink-0 mr-1" />
        Not released yet
      </span>
    );
  }

  return (
    <button
      id={`dl-cert-${ev._id}`}
      onClick={() => onDownload(ev._id, ev.title)}
      disabled={isDownloading}
      className={`clay-btn clay-btn-indigo text-[10px] font-mono font-semibold uppercase tracking-wide whitespace-nowrap ${mobile ? 'w-full justify-center min-h-[44px] gap-2 px-4 py-2' : 'gap-2 px-3 py-1.5 min-h-[36px]'}`}
    >
      {isDownloading
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> Generating…</>
        : <><Download className="w-3.5 h-3.5 shrink-0" /> Download Cert</>
      }
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// MEMBER HISTORY — Event Vault & Certificate Locker
// ─────────────────────────────────────────────────────────────
const MemberHistory = () => {
  const [vault, setVault]                 = useState([]);
  const [filter, setFilter]               = useState('all');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast]                 = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVault = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me/vault');
      setVault(res.data.data || []);
    } catch (err) {
      console.error('[MemberHistory] Vault fetch failed:', err.message);
      setError('Could not load your vault. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

  /**
   * Streams the PNG certificate from the backend and triggers a native download.
   * GET /api/certificates/download/:eventId — zero-storage architecture.
   */
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
      const blobUrl  = URL.createObjectURL(response.data);
      const anchor   = document.createElement('a');
      anchor.href     = blobUrl;
      anchor.download = `ACE_Certificate_${safeTitle}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
      showToast('Certificate downloaded successfully.', 'success');
    } catch (err) {
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

  // ── Derived counts ────────────────────────────────────────
  const now = new Date();
  
  const filteredVault = vault.filter(v => {
    if (filter === 'all') return true;
    const isPast = new Date(v.eventDate) < now;
    if (filter === 'completed') return isPast;
    if (filter === 'active') return !isPast;
    return true;
  });

  const certCount        = filteredVault.filter(v => v.hasCertificate).length;
  const pendingCertCount = filteredVault.filter(v => !v.hasCertificate).length;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── Toast ───────────────────────────────────────── */}
        {toast && (
          <div
            className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm"
            style={{
              background: toast.type === 'success' ? 'rgba(6,78,59,0.95)' : 'rgba(69,10,10,0.95)',
              border: toast.type === 'success' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)',
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#34d399' }} />
              : <XCircle    className="w-4 h-4 shrink-0" style={{ color: '#f87171' }} />
            }
            {toast.message}
          </div>
        )}

        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100">
              <History className="w-5 h-5" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex">
                <BlurText text="My Vault" delay={50} animateBy="letters" direction="bottom" />
              </h1>
              <p className="text-xs font-mono mt-0.5 text-slate-500">
                Event history &amp; certificate locker
              </p>
            </div>
          </div>

          {/* ── Filter Tabs ───────────────────────────────── */}
          {!loading && !error && vault.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl self-start sm:self-auto">
              {['all', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                    filter === f 
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── States ──────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#818cf8' }} />
            <p className="text-xs font-mono" style={{ color: '#475569' }}>Loading your vault…</p>
          </div>
        ) : error ? (
          <div
            className="flex items-center gap-3 text-sm font-medium px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(69,10,10,0.4)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        ) : filteredVault.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-28 rounded-2xl gap-4"
            style={{ border: '1px dashed rgba(255,255,255,0.07)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-100 border border-slate-200">
              <Award className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                {filter === 'all' ? 'Your vault is empty' : `No ${filter} events found`}
              </p>
              <p className="text-xs font-mono mt-1 text-slate-500">
                {filter === 'all' ? 'Register for events to earn certificates.' : 'Try changing the filter.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Stats Row ───────────────────────────────── */}
            <div className="flex gap-4 mb-8">
              <StatBlock value={filteredVault.length} label={filter === 'all' ? "Events Attended" : filter === 'active' ? "Active Events" : "Completed Events"} color="#818cf8" clayColor="clay-indigo" />
              <StatBlock value={certCount} label="Certs Available" color="#34d399" clayColor="clay-green" />
              {pendingCertCount > 0 && (
                <StatBlock value={pendingCertCount} label="Certs Pending" color="#d97706" clayColor="clay-amber" />
              )}
            </div>

            {/* ── Desktop Table ────────────────────────────── */}
            <div className="clay-card clay-slate hidden sm:block overflow-hidden mb-6">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[580px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['#', 'Event', 'Date', 'Venue', 'Certificate'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-4 text-[10px] font-mono font-bold uppercase tracking-[0.15em] whitespace-nowrap text-slate-500 ${i === 4 ? 'text-right' : ''}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVault.map((ev, idx) => (
                      <tr
                        key={ev._id}
                        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4 text-[10px] font-mono text-slate-500">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800 leading-snug">{ev.title}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap text-slate-600">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {new Date(ev.eventDate).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-slate-500">
                            {ev.venue || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <CertCell
                            ev={ev}
                            downloadingId={downloadingId}
                            onDownload={handleDownloadCert}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ─────────────────────────────── */}
            <div className="sm:hidden space-y-3">
              {filteredVault.map((ev) => (
                <div key={ev._id} className="clay-card clay-pink p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{ev.title}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-slate-500">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {new Date(ev.eventDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        {ev.venue ? ` · ${ev.venue}` : ''}
                      </div>
                    </div>
                  </div>
                  <CertCell
                    ev={ev}
                    downloadingId={downloadingId}
                    onDownload={handleDownloadCert}
                    mobile
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemberHistory;

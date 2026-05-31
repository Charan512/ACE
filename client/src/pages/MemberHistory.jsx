import { useState, useEffect, useCallback } from 'react';
import { History, Download, Loader2, AlertTriangle, Calendar, Award, TerminalSquare } from 'lucide-react';
import api from '../lib/api';

// ── Status Badge (Dark Mode) ──────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', label: 'CONFIRMED' },
    pending:   { cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20',  dot: 'bg-amber-400 animate-pulse', label: 'PENDING' },
    cancelled: { cls: 'bg-red-500/10    text-red-400    border-red-500/20',    dot: 'bg-red-400',   label: 'CANCELLED' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-widest ${s.cls}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// MEMBER HISTORY — Digital Locker (Dark Mode)
// ─────────────────────────────────────────────────────────────
const MemberHistory = () => {
  const [vault, setVault]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast]           = useState(null);

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
      setError('ERR: Could not establish link to vault. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

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
      const blobUrl  = URL.createObjectURL(response.data);
      const anchor   = document.createElement('a');
      anchor.href     = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);

      showToast('CERT_FETCH_SUCCESS', 'success');
    } catch (err) {
      const msg = err.response?.status === 403
        ? 'ERR_UNAUTHORIZED: Clearance level insufficient.'
        : 'ERR_FETCH: Download failed.';
      showToast(msg, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-10 max-w-5xl mx-auto bg-[#0a0a0a] min-h-[calc(100vh-4rem)] text-slate-300">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-mono font-semibold backdrop-blur-md
          ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' : 'bg-red-950/80 border-red-500/30 text-red-400'}`}>
          <span className="font-mono">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 flex items-center gap-3">
        <TerminalSquare className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-xl font-mono font-bold text-white tracking-widest uppercase">System_Vault</h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">History & Certificates</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono font-bold text-slate-500 tracking-widest uppercase">&gt; ESTABLISHING_LINK...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-500/30 text-red-400 text-sm font-mono font-bold px-5 py-4 rounded-xl shadow-[0_0_15px_rgba(248,113,113,0.1)]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      ) : vault.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
            <Award className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">&gt; VAULT_EMPTY</p>
            <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">No records found.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 shadow-sm">
              <p className="text-3xl font-mono font-black text-white">{vault.length}</p>
              <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mt-1">Modules_Accessed</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 shadow-sm">
              <p className="text-3xl font-mono font-black text-emerald-400">
                {vault.filter(v => !v.status || v.status === 'confirmed').length}
              </p>
              <p className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mt-1">Certs_Eligible</p>
            </div>
          </div>

          {/* Table (desktop) */}
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 shadow-sm overflow-hidden hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">IDX</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Module</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {vault.map((ev, idx) => (
                  <tr key={ev._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-200">{ev.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(ev.eventDate).toISOString().slice(0, 10)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ev.status || 'confirmed'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadCert(ev._id, ev.title)}
                        disabled={downloadingId === ev._id}
                        className="inline-flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-2 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
                      >
                        {downloadingId === ev._id
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> GEN...</>
                          : <><Download className="w-3.5 h-3.5" /> FETCH_CERT</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="sm:hidden space-y-4">
            {vault.map((ev, idx) => (
              <div key={ev._id} className="bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                      <Calendar className="w-3 h-3" />
                      TS: {new Date(ev.eventDate).toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <StatusBadge status={ev.status || 'confirmed'} />
                </div>
                <button
                  onClick={() => handleDownloadCert(ev._id, ev.title)}
                  disabled={downloadingId === ev._id}
                  className="w-full flex items-center justify-center gap-2 text-xs font-mono font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 py-2.5 rounded transition-colors disabled:opacity-40 uppercase tracking-widest"
                >
                  {downloadingId === ev._id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> GEN...</>
                    : <><Download className="w-4 h-4" /> FETCH_CERT</>
                  }
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MemberHistory;

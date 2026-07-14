import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle2, AlertTriangle, X, ScanLine, Loader2,
  ShieldCheck, User, BookOpen, GraduationCap, Hash
} from 'lucide-react';
import api from '../lib/api';

// ─────────────────────────────────────────────────────────────
// OVERLAY COMPONENTS
// ─────────────────────────────────────────────────────────────

// ── Verify Result Overlay (Mode 1) ───────────────────────────
const VerifyOverlay = ({ result, onDismiss }) => {
  if (!result) return null;

  if (!result.valid) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6"
        style={{ background: 'rgba(15,5,5,0.92)', backdropFilter: 'blur(8px)' }}>
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-1">INVALID</h2>
        <p className="text-sm text-red-300 font-mono mb-8">No ACE member found</p>
        <button onClick={onDismiss}
          className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
          Scan Again
        </button>
      </div>
    );
  }

  const { data: u } = result;
  const roleColors = {
    member: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34d399', label: 'MEMBER' },
    ebm:    { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa', label: 'EXEC. BODY MEMBER' },
    sbm:    { bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', text: '#818cf8', label: 'SENIOR BODY MEMBER' },
    admin:  { bg: 'rgba(244,63,94,0.15)',   border: 'rgba(244,63,94,0.3)',   text: '#f87171', label: 'ADMIN' },
  };
  const rc = roleColors[u.role] || roleColors.member;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6"
      style={{ background: 'rgba(3,15,10,0.95)', backdropFilter: 'blur(12px)' }}>
      {/* Big verified check */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(52,211,153,0.4)' }}>
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>

      <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-1">
        <span className="flex items-center gap-1.5 justify-center"><CheckCircle2 className="w-4 h-4" /> VERIFIED</span>
      </span>
      <h2 className="text-2xl font-black text-white mb-1 text-center">{u.name}</h2>

      {/* Role badge */}
      <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-6"
        style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
        {rc.label}
      </div>

      {/* Info grid */}
      <div className="w-full max-w-xs space-y-2 mb-8">
        {u.aceId && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-mono text-sm font-bold tracking-widest text-indigo-300">{u.aceId}</span>
          </div>
        )}
        {(u.branch || u.section) && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 font-mono">{[u.branch, u.section].filter(Boolean).join(' — ')}</span>
          </div>
        )}
        {u.year && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 font-mono">Year {u.year}</span>
          </div>
        )}
        {u.registrationNumber && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 font-mono">{u.registrationNumber}</span>
          </div>
        )}
      </div>

      <button onClick={onDismiss}
        className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
        Scan Next
      </button>
    </div>
  );
};

// ── Check-In Flash Overlay (Mode 2) ──────────────────────────
const CheckInOverlay = ({ state, onDismiss }) => {
  if (!state) return null;

  if (state.type === 'success') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6"
        style={{ background: 'rgba(3,15,10,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-5"
          style={{ border: '2px solid rgba(52,211,153,0.4)' }}>
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-emerald-400 mb-2">CHECKED IN</h2>
        <p className="text-lg font-bold text-white mb-1">{state.name}</p>
        {state.aceId && (
          <p className="text-sm font-mono text-indigo-300">{state.aceId}</p>
        )}
        <p className="text-xs text-slate-400 font-mono mt-6">Resuming scanner…</p>
      </div>
    );
  }

  if (state.type === 'already') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6"
        style={{ background: 'rgba(15,10,3,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-4"
          style={{ border: '2px solid rgba(245,158,11,0.4)' }}>
          <AlertTriangle className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-amber-400 mb-2">ALREADY SCANNED</h2>
        <p className="text-sm text-amber-200 font-mono mb-1">{state.name}</p>
        <p className="text-xs text-slate-400 font-mono mt-4">Resuming scanner…</p>
      </div>
    );
  }

  // Error
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6"
      style={{ background: 'rgba(15,5,5,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <X className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-xl font-black text-red-400 mb-2">ERROR</h2>
      <p className="text-sm text-red-300 font-mono text-center mb-8">{state.message || 'Scan failed'}</p>
      <button onClick={onDismiss}
        className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
        Dismiss
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OPS SCANNER
// ─────────────────────────────────────────────────────────────
const OpsScanner = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { mode = 'verify', eventId, eventTitle } = location.state || {};

  const scannerRef    = useRef(null);
  const qrRef         = useRef(null);
  const startPromiseRef = useRef(null);
  const isStartingRef   = useRef(false);  // guard against concurrent starts
  const isMountedRef    = useRef(true);   // guard against setState after unmount

  const [scanning,   setScanning]   = useState(false);
  const [initError,  setInitError]  = useState(null);
  // Mode 1: verifyResult
  const [verifyResult, setVerifyResult] = useState(null);
  // Mode 2: checkinState
  const [checkinState, setCheckinState] = useState(null);

  const isMode1 = mode === 'verify';

  // pendingRestart: set to true after overlay clears, triggering a DOM-safe restart via useEffect
  const [pendingRestart, setPendingRestart] = useState(false);

  // ── Start Scanner ────────────────────────────────────────
  const startScanner = useCallback(async () => {
    // Guard: skip if already starting OR DOM node isn't ready
    if (!qrRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      startPromiseRef.current = html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10 },
        onScanSuccess,
        () => {} // ignore decode failures
      );

      await startPromiseRef.current;
      if (isMountedRef.current) setScanning(true);
    } catch (err) {
      // NotAllowedError = camera permission denied by user/browser
      const isPermissionDenied = err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError');
      if (isMountedRef.current) {
        setInitError(
          isPermissionDenied
            ? 'Camera access was denied. Please allow camera permission in your browser settings and try again.'
            : 'Camera is not available. Please check your device and try again.'
        );
      }
      console.error('[OpsScanner]', err);
    } finally {
      isStartingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stop Scanner ─────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        // Await the start promise to ensure we don't call stop() while starting
        if (startPromiseRef.current) {
          await startPromiseRef.current.catch(() => {});
        }
        
        // Force stop tracks on the video element as a fallback
        try {
          const videoEl = document.querySelector('#qr-reader video');
          if (videoEl && videoEl.srcObject) {
            videoEl.srcObject.getTracks().forEach(track => track.stop());
          }
        } catch (e) {}

        // State 2 is SCANNING
        if (scannerRef.current.getState && scannerRef.current.getState() === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('[OpsScanner] Failed to stop', err);
      }
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── DOM-safe restart after flash overlay clears ───────────
  // Runs AFTER React commits, guaranteeing #qr-reader is visible
  useEffect(() => {
    if (!pendingRestart) return;
    setPendingRestart(false);
    if (!isMountedRef.current) return; // don't restart on unmounted component
    startScanner().catch(() => {
      if (isMountedRef.current) {
        setInitError('Camera failed to restart. Please close and reopen the scanner.');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRestart]);

  // ── On Scan Success ───────────────────────────────────────
  const onScanSuccess = async (decodedText) => {
    if (!scannerRef.current) return;
    await stopScanner();

    if (isMode1) {
      await handleVerify(decodedText);
    } else {
      await handleCheckIn(decodedText);
    }
  };

  // ── Mode 1: Verify ────────────────────────────────────────
  const handleVerify = async (scannedId) => {
    try {
      const res = await api.get(`/ops/verify/${scannedId}`);
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({ valid: false });
    }
  };

  // ── Mode 2: Check-In ─────────────────────────────────────
  const handleCheckIn = async (scannedId) => {
    try {
      const payload = /^26ACE\d{4}$/.test(scannedId) ? { aceId: scannedId } : { userId: scannedId };
      const res = await api.put(`/ops/events/${eventId}/checkin`, payload);
      const reg = res.data.data;
      setCheckinState({
        type:  'success',
        name:  reg.name,
        aceId: reg.userId?.aceId || null,
      });
      // Clear overlay after 2s, then trigger DOM-safe restart via useEffect
      setTimeout(() => setCheckinState(null), 2000);
      setTimeout(() => setPendingRestart(true), 2000);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'ALREADY_SCANNED') {
        setCheckinState({ type: 'already', name: 'This person', message: null });
        setTimeout(() => setCheckinState(null), 1500);
        setTimeout(() => setPendingRestart(true), 1500);
      } else {
        setCheckinState({ type: 'error', message: msg || 'Check-in failed.' });
      }
    }
  };

  // ── Dismiss overlays and resume scanner ───────────────────
  const handleDismiss = () => {
    setVerifyResult(null);
    setCheckinState(null);
    startScanner();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-4 z-20 relative">
        <button
          onClick={async () => { await stopScanner(); navigate(-1); }}
          className="flex items-center gap-2 text-white/70 font-medium text-sm hover:text-white transition-colors"
        >
          <X className="w-5 h-5" /> Close
        </button>
        <div className="flex flex-col items-center">
          <span className="text-white font-black text-sm tracking-wide">
            {isMode1 ? 'Verify Member' : 'Check-In Scanner'}
          </span>
          {!isMode1 && eventTitle && (
            <span className="text-[10px] font-mono text-orange-300 truncate max-w-[200px]">
              {eventTitle}
            </span>
          )}
        </div>
        <div
          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest"
          style={isMode1
            ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8' }
            : { background: 'rgba(234,88,12,0.2)',  color: '#fb923c' }
          }
        >
          {isMode1 ? 'VERIFY' : 'CHECK-IN'}
        </div>
      </div>

      {/* ── Camera Viewfinder ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center relative" ref={qrRef}>

        {/* Camera mount point */}
        <div id="qr-reader" className="w-full max-w-sm" />

        {/* Scanning ring UI */}
        {scanning && !verifyResult && !checkinState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="w-60 h-60 rounded-2xl"
              style={{ border: `3px solid ${isMode1 ? '#818cf8' : '#ea580c'}`, boxShadow: `0 0 0 4000px rgba(0,0,0,0.6)` }}
            />
            <p className="text-white/60 text-sm font-mono mt-8 animate-pulse">
              {isMode1 ? 'Point at member QR code' : 'Scan member badge'}
            </p>
          </div>
        )}

        {/* Loading state */}
        {!scanning && !initError && !verifyResult && !checkinState && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            <p className="text-sm font-mono">Starting camera…</p>
          </div>
        )}

        {/* Camera error */}
        {initError && (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <p className="text-white font-bold">Camera Unavailable</p>
            <p className="text-sm text-slate-400 font-mono">{initError}</p>
            <button
              onClick={async () => { await stopScanner(); navigate(-1); }}
              className="mt-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-sm">
              Go Back
            </button>
          </div>
        )}

        {/* Mode 1 Overlay */}
        <VerifyOverlay result={verifyResult} onDismiss={handleDismiss} />

        {/* Mode 2 Overlay */}
        <CheckInOverlay state={checkinState} onDismiss={handleDismiss} />
      </div>

      {/* ── Bottom Instructions ───────────────────────────── */}
      <div className="px-4 pb-8 pt-4 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ScanLine className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">
            {isMode1 ? 'Reads ACE ID from Digital ID Card' : 'Marks attendance in real-time'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OpsScanner;

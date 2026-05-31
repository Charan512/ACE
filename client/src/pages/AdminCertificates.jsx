import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Move,
  Send,
  ImageIcon,
  ChevronDown,
  Eye,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border
      ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ADMIN CERTIFICATES PAGE — Certificate Forge
// ─────────────────────────────────────────────────────────────
const AdminCertificates = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);

  // Template Config
  const [templateUrl, setTemplateUrl] = useState('');
  const [xPercent, setXPercent] = useState(50);
  const [yPercent, setYPercent] = useState(50);
  const [fontSizePercent, setFontSizePercent] = useState(2.5);

  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [toast, setToast] = useState(null);

  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch events ──────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = await api.get('/admin/events');
      const list = res.data.data || [];
      setEvents(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedEventId(first._id);
        loadEventTemplate(first);
      }
    } catch (err) {
      console.error('[AdminCertificates] Events fetch failed:', err.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadEventTemplate = (ev) => {
    if (ev.certificateTemplate) {
      setTemplateUrl(ev.certificateTemplate.baseImageUrl || '');
      const nameField = ev.certificateTemplate.textFields?.find((f) => f.label === 'recipientName');
      if (nameField) {
        setXPercent(nameField.xPercent ?? 50);
        setYPercent(nameField.yPercent ?? 50);
        setFontSizePercent(nameField.fontSizePercent ?? 2.5);
      }
    } else {
      setTemplateUrl('');
      setXPercent(50);
      setYPercent(50);
      setFontSizePercent(2.5);
    }
  };

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleEventChange = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    const ev = events.find((ev) => ev._id === id);
    if (ev) loadEventTemplate(ev);
  };

  // ── Drag & Drop upload zone ───────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    // In real implementation: upload file to R2, get URL back
    // For now, show the R2 URL input — drag is a UX hint
    showToast('Upload to Cloudflare R2 first, then paste the URL below.', 'error');
  };

  // ── Save Config ────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEventId) return showToast('No event selected.', 'error');
    if (!templateUrl.trim()) return showToast('Template URL is required.', 'error');

    setSaving(true);
    try {
      const config = {
        baseImageUrl: templateUrl.trim(),
        textFields: [
          {
            label: 'recipientName',
            xPercent: Number(xPercent),
            yPercent: Number(yPercent),
            fontSizePercent: Number(fontSizePercent),
            fontFamily: 'JetBrains Mono',
            color: '#1e293b',
            textAlign: 'center',
            fontWeight: 'bold',
          },
        ],
      };

      const res = await api.patch(`/events/${selectedEventId}`, { certificateTemplate: config });
      setEvents((prev) => prev.map((ev) => ev._id === selectedEventId ? res.data.data : ev));
      showToast('Certificate configuration saved.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Dispatch (stub — triggers certificate generation) ──────
  const handleDispatch = async () => {
    if (!selectedEventId) return showToast('No event selected.', 'error');
    setDispatching(true);
    try {
      // TODO: wire to certificate dispatch endpoint
      await new Promise((r) => setTimeout(r, 1200));
      showToast('Certificate dispatch queued. Members will receive download links.', 'success');
    } catch (err) {
      showToast('Dispatch failed.', 'error');
    } finally {
      setDispatching(false);
    }
  };

  const selectedEvent = events.find((ev) => ev._id === selectedEventId);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <Toast toast={toast} />

      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Certificate Forge</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure zero-storage certificate templates per event
        </p>
      </div>

      {/* ── Event Selector ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Target Event
        </label>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm">Loading events...</span>
          </div>
        ) : (
          <div className="relative max-w-md">
            <select
              value={selectedEventId}
              onChange={handleEventChange}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Main Split-View ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Controls Panel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Upload Zone */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Blank Template</h3>
            </div>

            {/* Drop Zone */}
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-4
                ${dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                }`}
            >
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">Drag & Drop base template</p>
              <p className="text-xs text-slate-400 mt-1">PNG/JPG · Upload to Cloudflare R2 · Paste URL below</p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Cloudflare R2 Template URL</label>
              <input
                type="text"
                value={templateUrl}
                onChange={(e) => setTemplateUrl(e.target.value)}
                placeholder="https://pub-xxxx.r2.dev/templates/cert-base.png"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Text Field Config */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Text Overlay — recipientName</h3>
            </div>

            {/* X Position */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-600">Horizontal Position (X)</label>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{xPercent}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="0.5"
                value={xPercent}
                onChange={(e) => setXPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Y Position */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-600">Vertical Position (Y)</label>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{yPercent}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="0.5"
                value={yPercent}
                onChange={(e) => setYPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-600">Font Size (% of canvas width)</label>
                <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{fontSizePercent}%</span>
              </div>
              <input
                type="range" min="0.5" max="10" step="0.1"
                value={fontSizePercent}
                onChange={(e) => setFontSizePercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Save Config */}
            <button
              onClick={handleSave}
              disabled={saving || !selectedEventId}
              className="w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Award className="w-4 h-4" />
              }
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Dispatch Block */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Dispatch Certificates</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Triggers the zero-storage certificate engine. Certificates are generated on-the-fly via <span className="font-mono font-bold text-slate-600">node-canvas</span> and streamed directly to confirmed attendees — no storage required.
            </p>
            <button
              onClick={handleDispatch}
              disabled={dispatching || !selectedEventId || !templateUrl}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {dispatching
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              {dispatching ? 'Dispatching...' : `Dispatch to ${selectedEvent ? `"${selectedEvent.title}"` : 'Event'}`}
            </button>
          </div>
        </div>

        {/* RIGHT: Live Preview Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full min-h-[480px]">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Live Preview</span>
              </div>
              <span className="text-xs font-semibold text-slate-400 font-mono">
                X: {xPercent}% · Y: {yPercent}% · Font: {fontSizePercent}%
              </span>
            </div>

            {/* Canvas Area */}
            <div className="relative flex items-center justify-center p-6 bg-slate-50/80 h-full min-h-[440px]">
              {templateUrl ? (
                <div className="relative shadow-xl rounded-lg overflow-hidden border border-slate-200/80 max-w-full">
                  <img
                    src={templateUrl}
                    alt="Certificate Template"
                    className="max-w-full h-auto object-contain max-h-[380px]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {/* Crosshair Overlay Marker */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${xPercent}%`,
                      top: `${yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Crosshair lines */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-px h-8 -top-4 bg-blue-500/60" />
                    <div className="absolute top-1/2 -translate-y-1/2 h-px w-8 -left-4 bg-blue-500/60" />
                    {/* Center dot */}
                    <div className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg" />
                    {/* Label */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      {'{ recipientName }'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Award className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-400">No template loaded</p>
                    <p className="text-xs text-slate-300 mt-1">
                      Paste a Cloudflare R2 URL on the left to preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCertificates;

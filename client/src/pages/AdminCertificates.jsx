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
  Plus,
  X,
  Type,
  Link,
  Check,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border animate-slide-up
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

  // Template Config State
  const [templateUrl, setTemplateUrl] = useState('');
  const [textFields, setTextFields] = useState([]);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  
  // Dragging State
  const containerRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const [toast, setToast] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');

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
      showToast('Failed to load events.', 'error');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadEventTemplate = (ev) => {
    if (ev.certificateTemplate) {
      setTemplateUrl(ev.certificateTemplate.baseImageUrl || '');
      setTextFields(ev.certificateTemplate.textFields || []);
    } else {
      setTemplateUrl('');
      setTextFields([
        {
          label: 'recipientName',
          xPercent: 50,
          yPercent: 50,
          fontSizePercent: 2.5,
          fontFamily: 'JetBrains Mono',
          color: '#1e293b',
          textAlign: 'center',
          fontWeight: 'bold',
        }
      ]);
    }
  };

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleEventChange = (e) => {
    const id = e.target.value;
    setSelectedEventId(id);
    const ev = events.find((ev) => ev._id === id);
    if (ev) loadEventTemplate(ev);
  };

  // ── Upload Template via Cloudinary ────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/admin/upload/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTemplateUrl(data.data.url);
      showToast('Template uploaded to Cloudinary ✓', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload template.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── Node Management ───────────────────────────────────────
  const addTextNode = () => {
    setTextFields([
      ...textFields,
      {
        label: `newField${textFields.length + 1}`,
        xPercent: 50,
        yPercent: 50,
        fontSizePercent: 2.5,
        fontFamily: 'JetBrains Mono',
        color: '#1e293b',
        textAlign: 'center',
        fontWeight: 'bold',
      }
    ]);
  };

  const removeTextNode = (idx) => {
    setTextFields(textFields.filter((_, i) => i !== idx));
  };

  const handleNodeChange = (idx, field, value) => {
    const updated = [...textFields];
    updated[idx][field] = value;
    setTextFields(updated);
  };

  // ── Drag & Drop Logic (Native Mouse Events) ───────────────
  const handleMouseDown = (e, idx) => {
    e.preventDefault();
    setDraggingIdx(idx);
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingIdx === null || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate raw percentage
    let rawX = ((e.clientX - rect.left) / rect.width) * 100;
    let rawY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp between 0 and 100 to prevent dragging outside container
    const clampedX = Math.max(0, Math.min(100, rawX));
    const clampedY = Math.max(0, Math.min(100, rawY));

    setTextFields((prev) => {
      const arr = [...prev];
      arr[draggingIdx] = {
        ...arr[draggingIdx],
        xPercent: Number(clampedX.toFixed(2)),
        yPercent: Number(clampedY.toFixed(2)),
      };
      return arr;
    });
  }, [draggingIdx]);

  const handleMouseUp = useCallback(() => {
    setDraggingIdx(null);
  }, []);

  // Attach global listeners for smooth dragging outside the node boundaries
  useEffect(() => {
    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIdx, handleMouseMove, handleMouseUp]);


  // ── Save Config ────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedEventId) return showToast('No event selected.', 'error');
    if (!templateUrl.trim()) return showToast('Template image is required.', 'error');
    if (textFields.length === 0) return showToast('At least one text field is required.', 'error');

    setSaving(true);
    try {
      const config = {
        baseImageUrl: templateUrl.trim(),
        textFields: textFields.map(tf => ({
          ...tf,
          xPercent: Number(tf.xPercent),
          yPercent: Number(tf.yPercent),
          fontSizePercent: Number(tf.fontSizePercent),
        })),
      };

      const res = await api.patch(`/admin/events/${selectedEventId}`, { certificateTemplate: config });
      setEvents((prev) => prev.map((ev) => ev._id === selectedEventId ? res.data.data : ev));
      showToast('Certificate configuration saved successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Dispatch (releases certificates to member portal + emails guests) ──
  const handleDispatch = async () => {
    if (!selectedEventId) return showToast('No event selected.', 'error');
    setDispatching(true);
    try {
      // IMPORTANT: Use the dedicated /release-certificates endpoint — NOT PATCH /admin/events/:id.
      // The general PATCH strips 'certificatesReleased' via sanitizeEventUpdate.
      // This endpoint flips the flag AND enqueues the BullMQ guest certificate email batch.
      await api.patch(`/admin/events/${selectedEventId}/release-certificates`);
      setEvents((prev) =>
        prev.map((ev) => ev._id === selectedEventId ? { ...ev, certificatesReleased: true } : ev)
      );
      showToast('Certificates released! Members can download. Guests will receive email shortly.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Dispatch failed.', 'error');
    } finally {
      setDispatching(false);
    }
  };

  const selectedEvent = events.find((ev) => ev._id === selectedEventId);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <Toast toast={toast} />

      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Certificate Forge</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visually configure zero-storage certificate templates
        </p>
      </div>

      {/* ── Event Selector ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Target Event
        </label>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-red-500 font-semibold">No events found in the system.</p>
        ) : (
          <div className="relative max-w-md">
            <select
              value={selectedEventId}
              onChange={handleEventChange}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} {ev.isActive ? '• LIVE' : '• Inactive'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Main Split-View ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: Controls Panel */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full max-h-[800px]">

          {/* Upload Zone */}
          <div className="clay-card clay-blue p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Base Template</h3>
              </div>
              {/* Toggle pill */}
              <div className="flex items-center gap-1 p-1 bg-white/60 rounded-xl border border-blue-100">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uploadMode === 'file' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  <ImageIcon className="w-3 h-3" /> Upload File
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uploadMode === 'url' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  <Link className="w-3 h-3" /> Paste URL
                </button>
              </div>
            </div>

            {/* Preview strip */}
            {templateUrl && (
              <div className="relative w-full h-20 rounded-xl border border-blue-100 overflow-hidden shadow-sm mb-3 bg-slate-50">
                <img src={templateUrl} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setTemplateUrl(''); setUrlInput(''); }}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1.5 left-2 text-[10px] font-mono font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">Template set ✓</span>
              </div>
            )}

            {uploadMode === 'file' ? (
              <label className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploading ? 'bg-blue-50 border-blue-300' : 'bg-white border-blue-200 hover:border-blue-500 hover:bg-blue-50'
              }`}>
                <div className="flex items-center gap-2">
                  {uploading
                    ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    : <ImageIcon className="w-5 h-5 text-blue-500" />}
                  <span className="text-sm font-semibold text-slate-700">
                    {uploading ? 'Uploading to R2…' : 'Click to upload image'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — max 10 MB</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  className="clay-input flex-1 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
                  placeholder="https://example.com/certificate-template.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = urlInput.trim();
                    if (!url) return;
                    
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      return showToast('Please enter a valid web URL starting with http:// or https:// (not a filename).', 'error');
                    }

                    setTemplateUrl(url);
                    showToast('Template URL set.', 'success');
                  }}
                  className="clay-btn clay-btn-blue px-4 py-2.5 text-sm gap-1.5 shrink-0"
                >
                  <Check className="w-4 h-4" /> Apply
                </button>
              </div>
            )}
          </div>

          {/* Text Nodes List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Text Nodes</h3>
              </div>
              <button onClick={addTextNode} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Node
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {textFields.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                  No text nodes added. Click "Add Node" to begin.
                </div>
              )}
              {textFields.map((node, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-colors ${draggingIdx === idx ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <input 
                      type="text" 
                      value={node.label} 
                      onChange={(e) => handleNodeChange(idx, 'label', e.target.value)}
                      className="bg-white border border-slate-200 rounded text-xs font-mono font-bold px-2 py-1 w-32 focus:outline-none focus:border-blue-400"
                      placeholder="fieldLabel"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                        X:{node.xPercent}% Y:{node.yPercent}%
                      </span>
                      <button onClick={() => removeTextNode(idx)} className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Size */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Font Size (%)</label>
                      <input 
                        type="range" min="0.5" max="15" step="0.1" 
                        value={node.fontSizePercent} 
                        onChange={(e) => handleNodeChange(idx, 'fontSizePercent', e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    {/* Color */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color (Hex)</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={node.color} onChange={(e) => handleNodeChange(idx, 'color', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={node.color} onChange={(e) => handleNodeChange(idx, 'color', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded text-xs px-2 py-1 uppercase font-mono" />
                      </div>
                    </div>
                    {/* Font Family */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Font Family</label>
                      <select 
                        value={node.fontFamily || 'JetBrains Mono'}
                        onChange={(e) => handleNodeChange(idx, 'fontFamily', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 focus:outline-none focus:border-blue-400"
                      >
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-5 border-t border-slate-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !selectedEventId}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Dispatch Block */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 shrink-0">
            <button
              onClick={handleDispatch}
              disabled={dispatching || !selectedEventId || !templateUrl}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {dispatching ? 'Dispatching...' : `Dispatch to ${selectedEvent ? `"${selectedEvent.title}"` : 'Event'}`}
            </button>
          </div>
        </div>

        {/* RIGHT: Live Preview Canvas */}
        <div className="lg:col-span-7">
          <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-inner overflow-hidden h-[800px] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Visual Forge</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                Drag nodes to position
              </span>
            </div>

            {/* Interactive Canvas Area */}
            <div 
              className="flex-1 relative overflow-auto p-8 flex items-center justify-center"
              style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {templateUrl ? (
                <div 
                  ref={containerRef}
                  className="relative shadow-2xl bg-white border border-slate-200 select-none overflow-hidden"
                  style={{ width: '100%', maxWidth: '800px', aspectRatio: '29.7/21' }} // A4 horizontal
                >
                  <img
                    src={templateUrl}
                    alt="Certificate Template"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  
                  {/* Render Draggable Nodes */}
                  {textFields.map((node, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => handleMouseDown(e, idx)}
                      className={`absolute whitespace-nowrap px-3 py-1.5 rounded-lg border-2 shadow-lg flex flex-col items-center gap-1 transition-transform ${
                        draggingIdx === idx 
                          ? 'border-blue-500 bg-blue-500/10 scale-105 z-50 cursor-grabbing' 
                          : 'border-transparent hover:border-slate-400/50 hover:bg-slate-900/5 z-10 cursor-grab'
                      }`}
                      style={{
                        left: `${node.xPercent}%`,
                        top: `${node.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        // Font size scaled relative to container width (approximated for preview)
                        fontSize: `clamp(10px, ${node.fontSizePercent}vw, 32px)`, 
                        color: node.color,
                        fontFamily: node.fontFamily,
                        fontWeight: node.fontWeight,
                      }}
                    >
                      {draggingIdx === idx && (
                        <>
                          <div className="absolute left-1/2 -translate-x-1/2 w-px h-16 -top-8 bg-blue-500/50 pointer-events-none" />
                          <div className="absolute top-1/2 -translate-y-1/2 h-px w-16 -left-8 bg-blue-500/50 pointer-events-none" />
                        </>
                      )}
                      
                      {/* Visual Anchor Dot */}
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none ${draggingIdx === idx ? 'bg-blue-600 ring-2 ring-white' : 'bg-transparent'}`} />
                      
                      <span className="pointer-events-none relative z-10 select-none drop-shadow-sm">
                        {`{{${node.label}}}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-500 mb-1">No Template Loaded</p>
                    <p className="text-sm">Upload a base image on the left to activate the Forge.</p>
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

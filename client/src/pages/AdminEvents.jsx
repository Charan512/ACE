import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, ToggleLeft, ToggleRight, Loader2,
  AlertTriangle, CheckCircle2, Edit3, Tag, Clock, MapPin,
  RefreshCw, UploadCloud, X, Users, Link2, FormInput,
  ChevronDown, Trash2, GripVertical, Zap, Globe, FileText, Mail, Eye, EyeOff, Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border animate-slide-up
      ${isSuccess ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
};

// ── Status Badge (isActive) ──────────────────────────────────
const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
    ${isActive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-100 text-slate-500 border-slate-200'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
    {isActive ? 'LIVE' : 'INACTIVE'}
  </span>
);

// ── Publish Badge (event.status) ─────────────────────────────
const PublishBadge = ({ status }) => {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
        <Globe className="w-2.5 h-2.5" /> Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
      <FileText className="w-2.5 h-2.5" /> Draft
    </span>
  );
};

// ── Format date ───────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  // Build the datetime-local string from LOCAL time components.
  // Avoids the timezone-offset mutation bug where setMinutes + toISOString
  // could push the date across a midnight boundary (e.g. IST +5:30).
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

// ── Field Type Config ─────────────────────────────────────────
const FIELD_TYPES = [
  { value: 'text',   label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown (Select)' },
  { value: 'radio',  label: 'Multiple Choice (Radio)' },
];

const newField = () => ({
  fieldName: '',
  fieldType: 'text',
  required: false,
  options: [],
  _tmpOption: '', // ephemeral input buffer — NOT sent to backend
});

// ── Form Builder — Single Field Row ──────────────────────────
const FieldRow = ({ field, idx, onChange, onRemove }) => {
  const needsOptions = field.fieldType === 'select' || field.fieldType === 'radio';

  const addOption = () => {
    const val = (field._tmpOption || '').trim();
    if (!val) return;
    onChange(idx, 'options', [...field.options, val]);
    onChange(idx, '_tmpOption', '');
  };

  const removeOption = (optIdx) => {
    onChange(idx, 'options', field.options.filter((_, i) => i !== optIdx));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
      {/* Row header */}
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Field {idx + 1}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
          title="Remove field"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Field Name + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Field Label *</label>
          <input
            type="text"
            required
            placeholder='e.g. "T-Shirt Size"'
            value={field.fieldName}
            onChange={(e) => onChange(idx, 'fieldName', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Input Type *</label>
          <div className="relative">
            <select
              value={field.fieldType}
              onChange={(e) => onChange(idx, 'fieldType', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Required Toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
        <div
          onClick={() => onChange(idx, 'required', !field.required)}
          className={`w-9 h-5 rounded-full transition-colors relative ${field.required ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
        <span className="text-xs font-bold text-slate-600">Required field</span>
      </label>

      {/* Options (only for select / radio) */}
      {needsOptions && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Answer Options</p>

          {/* Existing options */}
          {field.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt, optIdx) => (
                <span
                  key={optIdx}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm"
                >
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(optIdx)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new option */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type an option and press Enter…"
              value={field._tmpOption || ''}
              onChange={(e) => onChange(idx, '_tmpOption', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Event Modal ───────────────────────────────────────────────
const EventModal = ({ onClose, onSaved, initialData }) => {
  const [form, setForm] = useState(
    initialData
      ? {
          _id: initialData._id,
          title: initialData.title || '',
          description: initialData.description || '',
          eventDate: formatForInput(initialData.eventDate),
          registrationDeadline: formatForInput(initialData.registrationDeadline),
          venue: initialData.venue || '',
          memberFee: initialData.memberFee ?? '',
          standardFee: initialData.standardFee ?? '',
          maxCapacity: initialData.maxCapacity ?? '',
          posterImage: initialData.posterImage || '',
          coordinators: initialData.coordinators?.length ? initialData.coordinators : [{ name: '', phone: '' }],
          allowedYears: initialData.allowedYears?.length ? initialData.allowedYears : [1, 2, 3, 4],
          customFormFields: initialData.customFormFields?.length
            ? initialData.customFormFields.map(f => ({ ...f, _tmpOption: '' }))
            : [],
        }
      : {
          title: '',
          description: '',
          eventDate: '',
          registrationDeadline: '',
          venue: '',
          memberFee: '',
          standardFee: '',
          maxCapacity: '',
          posterImage: '',
          coordinators: [{ name: '', phone: '' }],
          allowedYears: [1, 2, 3, 4],
          customFormFields: [],
        }
  );

  // Per-event mail templates (separate from main form save)
  const [regConfirmTpl, setRegConfirmTpl] = useState(
    initialData?.registrationConfirmationEmail || { subject: '', body: '', isHtml: true }
  );
  const [certMailTpl, setCertMailTpl] = useState(
    initialData?.postEventCertificateEmail || { subject: '', body: '', isHtml: true }
  );
  const [savingMail, setSavingMail] = useState(null); // 'reg' | 'cert'
  const [mailSaveErr, setMailSaveErr] = useState('');
  const [mailPreview, setMailPreview] = useState(null); // 'reg' | 'cert'

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const isEditing = !!form._id;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCoordinatorChange = (index, field, value) => {
    const newCoords = [...form.coordinators];
    newCoords[index][field] = value;
    setForm({ ...form, coordinators: newCoords });
  };

  const addCoordinator = () => {
    setForm({ ...form, coordinators: [...form.coordinators, { name: '', phone: '' }] });
  };

  const removeCoordinator = (index) => {
    const newCoords = form.coordinators.filter((_, i) => i !== index);
    setForm({ ...form, coordinators: newCoords.length ? newCoords : [{ name: '', phone: '' }] });
  };

  // ── Form Builder Handlers ─────────────────────────────────
  const addFormField = () => {
    setForm((prev) => ({
      ...prev,
      customFormFields: [...prev.customFormFields, newField()],
    }));
  };

  const handleFieldChange = (idx, key, value) => {
    setForm((prev) => {
      const updated = prev.customFormFields.map((f, i) =>
        i === idx ? { ...f, [key]: value } : f
      );
      return { ...prev, customFormFields: updated };
    });
  };

  const removeFormField = (idx) => {
    setForm((prev) => ({
      ...prev,
      customFormFields: prev.customFormFields.filter((_, i) => i !== idx),
    }));
  };

  // Direct Cloudinary Upload Logic via Backend
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErr('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/admin/upload/poster', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Save the public URL to form state
      setForm((prev) => ({ ...prev, posterImage: data.data.url }));
    } catch (error) {
      console.error('Upload error:', error);
      setErr('Failed to upload poster image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');

    // Strip the ephemeral _tmpOption key before sending to backend
    const cleanedFields = form.customFormFields.map(({ _tmpOption, ...rest }) => rest);

    const payload = {
      ...form,
      memberFee: Number(form.memberFee),
      standardFee: Number(form.standardFee),
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
      coordinators: form.coordinators.filter((c) => c.name.trim() && c.phone.trim()),
      customFormFields: cleanedFields,
    };

    try {
      let res;
      if (isEditing) {
        res = await api.patch(`/admin/events/${form._id}`, payload);
      } else {
        res = await api.post('/admin/events', payload);
      }
      onSaved(res.data.data, isEditing);
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} event.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-amber-50' : 'bg-blue-50'}`}>
              {isEditing ? <Edit3 className="w-5 h-5 text-amber-600" /> : <CalendarDays className="w-5 h-5 text-blue-600" />}
            </div>
            <h2 className="text-lg font-black text-slate-900">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {err && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
              {err}
            </div>
          )}

          <div className="space-y-4">
            {/* Core Info */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Event Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium" placeholder="e.g. Prajwalan 2k26" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed" placeholder="Describe the event..." />
            </div>

            {/* Poster Upload */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Event Poster (A4 Aspect Ratio)</label>
              <div className="flex items-center gap-4">
                {form.posterImage && (
                  <div className="relative w-24 h-32 rounded-lg border border-slate-200 overflow-hidden shadow-sm shrink-0">
                    <img src={form.posterImage} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, posterImage: '' })}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'bg-slate-100 border-slate-300' : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                      ) : (
                        <UploadCloud className="w-6 h-6 text-blue-500 mb-2" />
                      )}
                      <p className="text-sm font-semibold text-slate-700">
                        {uploading ? 'Uploading to R2...' : 'Click to upload poster'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>

            {/* Date & Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Event Date *</label>
                <input type="datetime-local" name="eventDate" value={form.eventDate} onChange={handleChange} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Registration Deadline</label>
                <input type="datetime-local" name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Venue</label>
                <input name="venue" value={form.venue} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Main Auditorium" />
              </div>
            </div>

            {/* Fees & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Member Fee (₹) *</label>
                <input type="number" name="memberFee" value={form.memberFee} onChange={handleChange} required min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Standard Fee (₹) *</label>
                <input type="number" name="standardFee" value={form.standardFee} onChange={handleChange} required min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Max Capacity</label>
                <input type="number" name="maxCapacity" value={form.maxCapacity} onChange={handleChange} min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="∞" />
              </div>
            </div>

            {/* Year Exclusivity */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Target Audience (Years)</label>
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4].map(year => (
                  <label key={year} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      checked={form.allowedYears.includes(year)}
                      onChange={(e) => {
                        const newYears = e.target.checked 
                          ? [...form.allowedYears, year].sort()
                          : form.allowedYears.filter(y => y !== year);
                        setForm(prev => ({ ...prev, allowedYears: newYears.length ? newYears : [1,2,3,4] }));
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                If no years are selected, it defaults to all 4 years.
              </p>
            </div>

            {/* Coordinators */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Coordinators</label>
                <button type="button" onClick={addCoordinator} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {form.coordinators.map((coord, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input type="text" placeholder="Name" value={coord.name} onChange={(e) => handleCoordinatorChange(idx, 'name', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="Phone" value={coord.phone} onChange={(e) => handleCoordinatorChange(idx, 'phone', e.target.value)}
                      className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => removeCoordinator(idx)} className="text-slate-400 hover:text-red-500 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Registration Form Builder ─────────────────── */}
            <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FormInput className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Registration Form Fields
                  </label>
                  {form.customFormFields.length > 0 && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      {form.customFormFields.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addFormField}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              {form.customFormFields.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-blue-200 rounded-xl">
                  <FormInput className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No custom fields yet.</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Click "Add Field" to collect additional info from guests.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.customFormFields.map((field, idx) => (
                    <FieldRow
                      key={idx}
                      field={field}
                      idx={idx}
                      onChange={handleFieldChange}
                      onRemove={removeFormField}
                    />
                  ))}
                </div>
              )}

              {form.customFormFields.length > 0 && (
                <p className="text-[10px] text-slate-400 mt-3 text-center">
                  ⚡ Members bypass this form automatically (Fast-Pass).
                </p>
              )}
            </div>

            {/* ── Per-Event Email Templates (edit mode only) ─ */}
            {isEditing && (
              <div className="space-y-5">
                <div className="border-t border-dashed border-slate-200 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-violet-500" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Per-Event Email Templates</p>
                  </div>

                  {mailSaveErr && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl mb-3">{mailSaveErr}</div>
                  )}

                  {/* Registration Confirmation Email */}
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-700">Registration Confirmation Email</p>
                    <p className="text-[10px] text-violet-500">Sent to every registrant (member + guest) on successful registration. QR code (for guests) auto-attached.</p>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {[{v:'name',d:"Registrant's name"},{v:'event_name',d:'Event title'},{v:'event_date',d:'Date'}].map(vr => (
                        <span key={vr.v} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-violet-100 rounded-lg text-[10px]">
                          <code className="font-mono font-bold text-violet-600">{`{{${vr.v}}}`}</code>
                          <span className="text-slate-400">→ {vr.d}</span>
                        </span>
                      ))}
                    </div>
                    <input type="text" placeholder="Subject (e.g. Confirmed: {{event_name}})"
                      value={regConfirmTpl.subject}
                      onChange={e => setRegConfirmTpl(p => ({...p, subject: e.target.value}))}
                      className="w-full bg-white border border-violet-100 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <div className="flex gap-1 mb-1">
                      <button type="button" onClick={() => setRegConfirmTpl(p => ({...p, isHtml: true}))}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${regConfirmTpl.isHtml !== false ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-400'}`}>HTML</button>
                      <button type="button" onClick={() => setRegConfirmTpl(p => ({...p, isHtml: false}))}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${regConfirmTpl.isHtml === false ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-400'}`}>Text</button>
                      <div className="flex-1" />
                      <button type="button" onClick={() => setMailPreview(mailPreview === 'reg' ? null : 'reg')}
                        className="flex items-center gap-1 text-[10px] text-violet-600 font-bold">
                        {mailPreview === 'reg' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {mailPreview === 'reg' ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                    {mailPreview === 'reg' ? (
                      <div className="min-h-[100px] bg-white border border-violet-100 rounded-lg p-3 text-xs overflow-auto"
                        dangerouslySetInnerHTML={{ __html: (regConfirmTpl.body || '').replace(/\{\{(\w+)\}\}/g, (_, k) => ({name:'Priya Sharma',event_name:form.title||'Event',event_date:'15 Jul 2026'})[k] || `{{${k}}}`) }} />
                    ) : (
                      <textarea rows={4} placeholder="<p>Dear {{name}}, you're registered for <strong>{{event_name}}</strong>!</p>"
                        value={regConfirmTpl.body}
                        onChange={e => setRegConfirmTpl(p => ({...p, body: e.target.value}))}
                        className="w-full bg-white border border-violet-100 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    )}
                    <button type="button" disabled={savingMail === 'reg'} onClick={async () => {
                      if (!form._id) return;
                      setSavingMail('reg'); setMailSaveErr('');
                      try {
                        await api.patch(`/admin/events/${form._id}`, { registrationConfirmationEmail: regConfirmTpl });
                      } catch (e) { setMailSaveErr(e.response?.data?.message || 'Save failed.'); }
                      finally { setSavingMail(null); }
                    }} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 disabled:opacity-50 transition-all">
                      {savingMail === 'reg' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Registration Template
                    </button>
                  </div>

                  {/* Post-Event Certificate Email */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3 mt-4">
                    <p className="text-xs font-bold text-emerald-700">Post-Event Certificate Email</p>
                    <p className="text-[10px] text-emerald-600">Sent to all registrants when admin releases certificates. Certificate PNG auto-attached.</p>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {[{v:'name',d:"Registrant's name"},{v:'event_name',d:'Event title'},{v:'event_date',d:'Date'}].map(vr => (
                        <span key={vr.v} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-emerald-100 rounded-lg text-[10px]">
                          <code className="font-mono font-bold text-emerald-600">{`{{${vr.v}}}`}</code>
                          <span className="text-slate-400">→ {vr.d}</span>
                        </span>
                      ))}
                    </div>
                    <input type="text" placeholder="Subject (e.g. Your Certificate — {{event_name}})"
                      value={certMailTpl.subject}
                      onChange={e => setCertMailTpl(p => ({...p, subject: e.target.value}))}
                      className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    <div className="flex gap-1 mb-1">
                      <button type="button" onClick={() => setCertMailTpl(p => ({...p, isHtml: true}))}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${certMailTpl.isHtml !== false ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>HTML</button>
                      <button type="button" onClick={() => setCertMailTpl(p => ({...p, isHtml: false}))}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${certMailTpl.isHtml === false ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>Text</button>
                      <div className="flex-1" />
                      <button type="button" onClick={() => setMailPreview(mailPreview === 'cert' ? null : 'cert')}
                        className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        {mailPreview === 'cert' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {mailPreview === 'cert' ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                    {mailPreview === 'cert' ? (
                      <div className="min-h-[100px] bg-white border border-emerald-100 rounded-lg p-3 text-xs overflow-auto"
                        dangerouslySetInnerHTML={{ __html: (certMailTpl.body || '').replace(/\{\{(\w+)\}\}/g, (_, k) => ({name:'Priya Sharma',event_name:form.title||'Event',event_date:'15 Jul 2026'})[k] || `{{${k}}}`) }} />
                    ) : (
                      <textarea rows={4} placeholder="<p>Hi {{name}}, your certificate for <strong>{{event_name}}</strong> is attached!</p>"
                        value={certMailTpl.body}
                        onChange={e => setCertMailTpl(p => ({...p, body: e.target.value}))}
                        className="w-full bg-white border border-emerald-100 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    )}
                    <button type="button" disabled={savingMail === 'cert'} onClick={async () => {
                      if (!form._id) return;
                      setSavingMail('cert'); setMailSaveErr('');
                      try {
                        await api.patch(`/admin/events/${form._id}`, { postEventCertificateEmail: certMailTpl });
                      } catch (e) { setMailSaveErr(e.response?.data?.message || 'Save failed.'); }
                      finally { setSavingMail(null); }
                    }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all">
                      {savingMail === 'cert' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Certificate Template
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ADMIN EVENTS PAGE
// ─────────────────────────────────────────────────────────────
const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // event object

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/events');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('[AdminEvents] Fetch failed:', err.message);
      showToast('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleToggle = async (eventId) => {
    setToggling(eventId);
    try {
      const res = await api.patch(`/admin/events/${eventId}/toggle`);
      setEvents((prev) => prev.map((ev) => ev._id === eventId ? res.data.data : ev));
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Toggle failed.', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handlePublish = async (eventId) => {
    setPublishing(eventId);
    try {
      const res = await api.patch(`/admin/events/${eventId}/publish`);
      setEvents((prev) => prev.map((ev) => ev._id === eventId ? res.data.data : ev));
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Publish failed.', 'error');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = (ev) => setConfirmDelete(ev);

  const confirmDeleteHandler = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete._id);
    try {
      await api.delete(`/admin/events/${confirmDelete._id}`);
      setEvents((prev) => prev.filter((ev) => ev._id !== confirmDelete._id));
      showToast(`"${confirmDelete.title}" deleted.`, 'success');
      setConfirmDelete(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (eventToEdit) => {
    setEditingEvent(eventToEdit);
    setIsModalOpen(true);
  };

  const handleEventSaved = (savedEvent, isEdit) => {
    if (isEdit) {
      setEvents((prev) => prev.map((ev) => ev._id === savedEvent._id ? savedEvent : ev));
      showToast(`"${savedEvent.title}" updated successfully.`, 'success');
    } else {
      setEvents((prev) => [savedEvent, ...prev]);
      showToast(`"${savedEvent.title}" created successfully.`, 'success');
    }
  };

  const handleCopyLink = async (eventId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`);
      showToast('Public link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy link.', 'error');
    }
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <Toast toast={toast} />

      {isModalOpen && (
        <EventModal
          initialData={editingEvent}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleEventSaved}
        />
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-base font-black text-slate-900 text-center mb-1">Delete Event?</h2>
            <p className="text-sm text-slate-500 text-center mb-1">This will permanently delete</p>
            <p className="text-sm font-bold text-slate-800 text-center mb-1">&ldquo;{confirmDelete.title}&rdquo;</p>
            <p className="text-xs text-red-500 font-semibold text-center mb-6">All registrations and transactions will be cascade-deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={confirmDeleteHandler}
                disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Events</h1>
          <p className="text-sm text-slate-500 mt-1">{events.length} total events in system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-semibold text-slate-400">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No events found. Create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Venue</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fees</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Publish</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reg.</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev._id} className={`hover:bg-slate-50/60 transition-colors ${ev.status === 'draft' ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{ev.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <PublishBadge status={ev.status} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(ev.eventDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 max-w-[140px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{ev.venue || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-600">
                        <span className="text-emerald-600">₹{ev.memberFee}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-slate-500">₹{ev.standardFee}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Member / Standard</div>
                    </td>
                    <td className="px-5 py-4">
                      {/* Publish or Already-published column */}
                      {ev.status === 'published' ? (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      ) : (
                        <button
                          onClick={() => handlePublish(ev._id)}
                          disabled={publishing === ev._id}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {publishing === ev._id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Zap className="w-3 h-3" />
                          }
                          Publish
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge isActive={ev.isActive} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(ev._id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Copy Public Link"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(ev)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Toggle isActive */}
                        <button
                          onClick={() => handleToggle(ev._id)}
                          disabled={toggling === ev._id || ev.status !== 'published'}
                          className="flex items-center justify-center w-24 gap-1 text-xs font-bold px-2 py-1.5 rounded-xl border transition-all cursor-pointer disabled:opacity-30 hover:shadow-sm"
                          style={ev.isActive
                            ? { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }
                            : { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }
                          }
                          title={ev.status !== 'published' ? 'Publish event first' : ''}
                        >
                          {toggling === ev._id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : ev.isActive
                              ? <ToggleRight className="w-3.5 h-3.5" />
                              : <ToggleLeft className="w-3.5 h-3.5" />
                          }
                          {ev.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(ev)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;

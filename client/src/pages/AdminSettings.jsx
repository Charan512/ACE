import { useState, useEffect, useCallback } from 'react';
import {
  Settings, DollarSign, Mail, Award, Save, Loader2,
  CheckCircle2, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronUp,
  Info, Hash, AtSign, CreditCard, User, ArrowRight,
} from 'lucide-react';
import api from '../lib/api';

// ── Toast ──────────────────────────────────────────────────────
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

// ── Collapsible Section ────────────────────────────────────────
const Section = ({ icon: Icon, title, subtitle, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
          : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
        }
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
};

// ── Variable Chip ──────────────────────────────────────────────
const VarChip = ({ variable, description }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
    <code className="font-mono font-bold text-blue-600">{`{{${variable}}}`}</code>
    <ArrowRight className="w-4 h-4 text-slate-400" />
    <span className="text-slate-600">{description}</span>
  </div>
);

// ── Mail Template Editor ───────────────────────────────────────
const MailTemplateEditor = ({ label, variables, value, onChange }) => {
  const [preview, setPreview] = useState(false);

  const renderPreview = () => {
    if (!value.body) return '<p class="text-slate-400 text-sm">No body content yet.</p>';
    // Replace vars with demo data
    const demoData = {
      name: 'Priya Sharma', email: 'priya@example.com',
      ace_id: '26ACE0042', fee_paid: '500',
      event_name: 'Workshop on AI Ethics', event_date: '15 July 2026',
    };
    return value.body.replace(/\{\{(\w+)\}\}/g, (_, key) => demoData[key] || `{{${key}}}`);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>

      {/* Variable Reference */}
      <div className="flex flex-wrap gap-2">
        {variables.map(v => <VarChip key={v.v} variable={v.v} description={v.d} />)}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Line</label>
        <input
          type="text"
          value={value.subject || ''}
          onChange={e => onChange({ ...value, subject: e.target.value })}
          placeholder="e.g. Welcome to ACE — {{name}}"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
        />
      </div>

      {/* HTML Toggle */}
      <div className="flex items-center gap-2">
        <label className="block text-xs font-semibold text-slate-500">Body Format:</label>
        <button
          onClick={() => onChange({ ...value, isHtml: true })}
          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${value.isHtml !== false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
        >HTML</button>
        <button
          onClick={() => onChange({ ...value, isHtml: false })}
          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${value.isHtml === false ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
        >Plain Text</button>
      </div>

      {/* Body Editor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-500">Body</label>
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
          >
            {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div
            className="min-h-[180px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm prose prose-sm max-w-none overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderPreview() }}
          />
        ) : (
          <textarea
            value={value.body || ''}
            onChange={e => onChange({ ...value, body: e.target.value })}
            rows={8}
            placeholder={value.isHtml !== false
              ? '<p>Dear {{name}}, your ACE ID is <strong>{{ace_id}}</strong>. Fee paid: ₹{{fee_paid}}.</p>'
              : 'Dear {{name}}, your ACE membership is confirmed. Your ACE ID: {{ace_id}}'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />
        )}
        <p className="text-[10px] text-slate-400 mt-1">
          {value.isHtml !== false
            ? 'HTML supported. Variables like {{name}} are resolved before sending. Certificate is auto-attached as PNG.'
            : 'Plain text mode. Variables like {{name}} are resolved. Certificate is auto-attached as PNG.'}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ADMIN SETTINGS PAGE
// ─────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // which section is saving
  const [toast, setToast] = useState(null);

  // Settings state
  const [membershipFee, setMembershipFee] = useState(500);
  const [feeInput, setFeeInput] = useState('500');
  const [membershipEmailTpl, setMembershipEmailTpl] = useState({ subject: '', body: '', isHtml: true });
  const [certTemplate, setCertTemplate] = useState({ baseImageUrl: '', textFields: [] });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/settings');
      const s = data.data;
      setMembershipFee(s.membershipFee ?? 500);
      setFeeInput(String(s.membershipFee ?? 500));
      setMembershipEmailTpl(s.membershipConfirmationEmailTemplate || { subject: '', body: '', isHtml: true });
      setCertTemplate(s.membershipCertificateTemplate || { baseImageUrl: '', textFields: [] });
    } catch (err) {
      showToast('Failed to load settings. ' + (err.response?.data?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Save Membership Fee ─────────────────────────────────────
  const saveFee = async () => {
    const fee = Number(feeInput);
    if (isNaN(fee) || fee < 0) return showToast('Please enter a valid fee amount.', 'error');
    setSaving('fee');
    try {
      await api.patch('/admin/settings', { membershipFee: fee });
      setMembershipFee(fee);
      showToast(`Membership fee updated to ₹${fee}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update fee.', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ── Save Membership Email Template ──────────────────────────
  const saveEmailTemplate = async () => {
    setSaving('email');
    try {
      await api.patch('/admin/settings', { membershipConfirmationEmailTemplate: membershipEmailTpl });
      showToast('Membership email template saved.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save template.', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ── Save Cert Template ──────────────────────────────────────
  const saveCertTemplate = async () => {
    if (!certTemplate.baseImageUrl.trim()) {
      return showToast('Certificate base image URL is required.', 'error');
    }
    setSaving('cert');
    try {
      await api.patch('/admin/settings', { membershipCertificateTemplate: certTemplate });
      showToast('Membership certificate template saved.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save cert template.', 'error');
    } finally {
      setSaving(null);
    }
  };

  const addTextField = () => setCertTemplate(prev => ({
    ...prev,
    textFields: [
      ...prev.textFields,
      { label: 'recipientName', xPercent: 50, yPercent: 50, fontSizePercent: 2.5, fontFamily: 'JetBrains Mono', color: '#1e293b', textAlign: 'center', fontWeight: 'bold' }
    ]
  }));

  const removeTextField = (idx) => setCertTemplate(prev => ({
    ...prev, textFields: prev.textFields.filter((_, i) => i !== idx)
  }));

  const updateTextField = (idx, key, val) => setCertTemplate(prev => {
    const arr = [...prev.textFields];
    arr[idx] = { ...arr[idx], [key]: val };
    return { ...prev, textFields: arr };
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" /> ACE Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Global configuration — changes take effect immediately across all portals.
        </p>
      </div>

      {/* ── 1. Membership Fee ─────────────────────────────────── */}
      <Section icon={DollarSign} title="Membership Fee" subtitle={`Currently ₹${membershipFee}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <Info className="w-4 h-4 shrink-0" />
            Changing this fee updates the PhonePe payment amount and all in-person registrations instantly. No code change needed.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Fee Amount (₹ INR)</label>
            <div className="flex gap-2 max-w-xs">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={feeInput}
                  onChange={e => setFeeInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="500"
                />
              </div>
              <button
                onClick={saveFee}
                disabled={saving === 'fee'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {saving === 'fee' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Membership Confirmation Email Template ──────────── */}
      <Section
        icon={Mail}
        title="Membership Confirmation Email"
        subtitle="Sent to every new member after registration (online or cash)"
        defaultOpen={false}
      >
        <div className="space-y-5">
          <MailTemplateEditor
            label="Email Template"
            variables={[
              { v: 'name',     d: "Member's full name" },
              { v: 'email',    d: 'Member email address' },
              { v: 'ace_id',   d: 'Generated ACE ID (26ACE0001)' },
              { v: 'fee_paid', d: 'Fee paid in ₹' },
            ]}
            value={membershipEmailTpl}
            onChange={setMembershipEmailTpl}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <Award className="w-4 h-4 shrink-0" />
            The membership certificate PNG (configured below) is automatically attached to this email.
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveEmailTemplate}
              disabled={saving === 'email'}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
            >
              {saving === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Email Template
            </button>
          </div>
        </div>
      </Section>

      {/* ── 3. Membership Certificate Template ─────────────────── */}
      <Section
        icon={Award}
        title="Membership Certificate Template"
        subtitle="Attached to the membership confirmation email as a PNG"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <Info className="w-4 h-4 shrink-0" />
            Upload your blank certificate template to Cloudflare R2 and paste the public URL here.
            Text overlays are rendered on-the-fly — nothing is stored.
          </div>

          {/* Base Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Base Template Image URL (R2 Public URL)</label>
            <input
              type="url"
              value={certTemplate.baseImageUrl || ''}
              onChange={e => setCertTemplate(prev => ({ ...prev, baseImageUrl: e.target.value }))}
              placeholder="https://pub-xxxx.r2.dev/membership-cert-base.png"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Supported variables note */}
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'recipientName', d: "Member's name" },
              { v: 'aceId',        d: 'ACE ID' },
              { v: 'memberSince',  d: 'Registration date' },
            ].map(v => <VarChip key={v.v} variable={v.v} description={v.d} />)}
          </div>

          {/* Text Fields */}
          <div className="space-y-3">
            {certTemplate.textFields.map((field, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Field {idx + 1}</span>
                  <button
                    onClick={() => removeTextField(idx)}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Label (variable name)</label>
                    <select
                      value={field.label}
                      onChange={e => updateTextField(idx, 'label', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="recipientName">recipientName</option>
                      <option value="aceId">aceId</option>
                      <option value="memberSince">memberSince</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Color</label>
                    <input type="color" value={field.color || '#000000'} onChange={e => updateTextField(idx, 'color', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">X Position (%)</label>
                    <input type="number" min={0} max={100} step={0.5} value={field.xPercent} onChange={e => updateTextField(idx, 'xPercent', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Y Position (%)</label>
                    <input type="number" min={0} max={100} step={0.5} value={field.yPercent} onChange={e => updateTextField(idx, 'yPercent', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Font Size (% of width)</label>
                    <input type="number" min={0.5} max={20} step={0.1} value={field.fontSizePercent} onChange={e => updateTextField(idx, 'fontSizePercent', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Alignment</label>
                    <select value={field.textAlign} onChange={e => updateTextField(idx, 'textAlign', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addTextField}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Text Field
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveCertTemplate}
              disabled={saving === 'cert'}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60"
            >
              {saving === 'cert' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Certificate Template
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AdminSettings;

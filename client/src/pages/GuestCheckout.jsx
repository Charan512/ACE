import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, Loader2, AlertCircle, ShieldCheck, Building, BookOpen, Users, Hash } from 'lucide-react';
import api from '../lib/api';

// ── Reusable input wrapper ────────────────────────────────────
const InputField = ({ label, icon: Icon, required, children, ...props }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children || (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        <input
          required={required}
          {...props}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
            ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    )}
  </div>
);

// ── Dynamic Field Renderer ────────────────────────────────────
/**
 * Renders the correct HTML control for a single customFormField entry.
 * Reads value from `responses[field.fieldName]` and calls `onChange` on mutation.
 */
const DynamicField = ({ field, value, onChange }) => {
  const { fieldName, fieldType, required, options } = field;
  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  const renderControl = () => {
    switch (fieldType) {
      case 'number':
        return (
          <input
            type="number"
            required={required}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={inputCls}
            placeholder="Enter a number…"
          />
        );

      case 'select':
        return (
          <select
            required={required}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={`${inputCls} appearance-none cursor-pointer`}
          >
            <option value="" disabled>Select an option…</option>
            {(options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2.5 pt-1">
            {(options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0
                  ${value === opt ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {value === opt && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <input
                  type="radio"
                  required={required && !value}
                  name={fieldName}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(fieldName, opt)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            required={required}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={inputCls}
            placeholder={`Enter ${fieldName.toLowerCase()}…`}
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">
        {fieldName} {required && <span className="text-red-500">*</span>}
      </label>
      {renderControl()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// GUEST CHECKOUT
// ─────────────────────────────────────────────────────────────
const GuestCheckout = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Core contact fields (always required) ──────────────────
  const [coreData, setCoreData] = useState({ 
    name: '', email: '', phone: '', year: '',
    branch: '', section: '', gender: '', registrationNumber: ''
  });

  // ── Dynamic responses — key = fieldName, value = answer ───
  const [customResponses, setCustomResponses] = useState({});

  const [isProcessing, setIsProcessing] = useState(false);

  const setCoreField = (field) => (e) =>
    setCoreData((prev) => ({ ...prev, [field]: e.target.value }));

  const setResponse = (fieldName, value) =>
    setCustomResponses((prev) => ({ ...prev, [fieldName]: value }));

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Use the single-event endpoint so we get customFormFields
        const res = await api.get(`/events/${eventId}`);
        setEvent(res.data.data);
      } catch (err) {
        console.error('[GuestCheckout] Failed to fetch event:', err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  const hasCustomForm = event?.customFormFields?.length > 0;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // POST /payments/guest-order — creates a PhonePe event ticket order for a guest.
      // On webhook success: creates a confirmed Registration + emails QR entry pass to guest.
      const mergedResponses = {
        ...customResponses,
        phone: coreData.phone || undefined,
        branch: coreData.branch,
        section: coreData.section,
        gender: coreData.gender,
        registrationNumber: coreData.registrationNumber || undefined,
      };

      const orderRes = await api.post('/payments/guest-order', {
        eventId,
        name:            coreData.name,
        email:           coreData.email,
        phone:           coreData.phone || undefined,
        year:            coreData.year,
        customResponses: mergedResponses,
      });

      const { merchantTransactionId, redirectUrl } = orderRes.data.data;

      // Store txn ID to verify when user returns
      sessionStorage.setItem('ace_pending_txn', merchantTransactionId);

      // Redirect to PhonePe
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('[GuestCheckout]', err);
      alert(err.response?.data?.message || 'Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // ── Loading / Error States ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center bg-slate-50 px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
        <p className="text-slate-600">{error || 'Event not found.'}</p>
        <button onClick={() => navigate('/events')} className="mt-8 text-blue-600 font-medium hover:underline">
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 pt-32 pb-24 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header Card */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white text-center relative overflow-hidden mb-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-extrabold tracking-tight relative z-10 mb-1">Guest Registration</h1>
          <p className="text-slate-400 font-medium text-sm relative z-10">{event.title}</p>
        </div>

        {/* Pricing Banner */}
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-6 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-1">Standard Rate</p>
            <p className="text-xs text-slate-500">Non-member pricing · Includes event access</p>
          </div>
          <div className="text-3xl font-black text-slate-900">₹{event.standardFee}</div>
        </div>

        {/* Form */}
        <form onSubmit={handleCheckout} className="space-y-4">

          {/* Section 1: Core Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Your Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Full Name" icon={User} type="text" required placeholder="John Doe"
                  value={coreData.name} onChange={setCoreField('name')} />
                <InputField label="Phone Number" icon={Phone} type="tel" required placeholder="+91 98765 43210"
                  value={coreData.phone} onChange={setCoreField('phone')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="Email Address" icon={Mail} type="email" required placeholder="john@example.com"
                  value={coreData.email} onChange={setCoreField('email')} />
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={coreData.year}
                    onChange={setCoreField('year')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={coreData.branch}
                    onChange={setCoreField('branch')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSBS">CSBS</option>
                    <option value="CSD">CSD</option>
                    <option value="CIC">CIC</option>
                    <option value="IT">IT</option>
                    <option value="CSIT">CSIT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={coreData.section}
                    onChange={setCoreField('section')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                    <option value="F">Section F</option>
                    <option value="NA">N/A</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={coreData.gender}
                    onChange={setCoreField('gender')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <InputField label="Roll Number" icon={Hash} type="text" required placeholder="21CE1A0501"
                  value={coreData.registrationNumber} onChange={setCoreField('registrationNumber')} />
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Custom Fields (only if event has them) */}
          {hasCustomForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Event Details
                </h2>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {event.customFormFields.length} field{event.customFormFields.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-6 space-y-5">
                {event.customFormFields.map((field) => (
                  <DynamicField
                    key={field.fieldName}
                    field={field}
                    value={customResponses[field.fieldName]}
                    onChange={setResponse}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
          </button>

          <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure checkout via Razorpay
          </p>
        </form>
      </div>
    </div>
  );
};

export default GuestCheckout;

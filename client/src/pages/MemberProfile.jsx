import { useState, useEffect, useRef } from 'react';
import {
  User, Phone, BookOpen, Hash, GraduationCap, Building,
  CheckCircle2, AlertTriangle, Loader2, ShieldCheck, UserCog,
  ChevronDown, Camera, X, Edit3, Lock, Users
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import BlurText from '../components/react-bits/BlurText';
import api from '../lib/api';

const LinkedinIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ── Form Field Wrapper with Floating Labels & Micro-Animations 
const Field = ({ label, icon: Icon, children, focused, hasValue }) => {
  return (
    <div className="relative pt-4">
      {/* Floating Label */}
      <label
        className={`absolute left-10 transition-all duration-200 pointer-events-none z-10 ${
          focused || hasValue
            ? '-top-1 text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-white/80 px-1 rounded backdrop-blur-sm'
            : 'top-[26px] text-[13px] text-slate-400 font-mono'
        }`}
      >
        {label}
      </label>
      
      <div className="relative group">
        {Icon && (
          <Icon
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-all duration-300 ${
              focused ? 'text-indigo-500 scale-110' : 'text-slate-400'
            }`}
          />
        )}
        {children}
      </div>
    </div>
  );
};

// ── Shared input style ────────────────────────────────────────
const inputStyle = (focused, disabled) => ({
  width: '100%',
  background: disabled ? '#f8fafc' : (focused ? '#ffffff' : 'rgba(255,255,255,0.6)'),
  border: disabled ? '1px solid rgba(226,232,240,0.5)' : (focused ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(226,232,240,1)'),
  boxShadow: (!disabled && focused) ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
  borderRadius: '12px',
  padding: '11px 16px 11px 40px',
  fontSize: '13px',
  fontFamily: 'JetBrains Mono, monospace',
  color: disabled ? '#64748b' : '#0f172a',
  outline: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: disabled ? 'not-allowed' : 'text',
});

// ─────────────────────────────────────────────────────────────
// MEMBER PROFILE — Profile Editor
// ─────────────────────────────────────────────────────────────
const MemberProfile = () => {
  const { user, updateProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name:               user?.name               || '',
    phone:              user?.phone              || '',
    branch:             user?.branch             || '',
    section:            user?.section            || '',
    year:               user?.year               || '',
    registrationNumber: user?.registrationNumber || '',
    gender:             user?.gender             || '',
    linkedin:           user?.linkedin           || '',
  });
  
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef              = useRef(null);
  const [localAvatar, setLocalAvatar] = useState(user?.profilePhoto || '');
  
  // Track focus states for floating labels
  const [focusState, setFocusState] = useState({
    name: false,
    phone: false,
    branch: false,
    section: false,
    year: false,
    registrationNumber: false,
    gender: false,
    linkedin: false,
  });

  const setField = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const hasChanges = Object.keys(formData).some(k => formData[k] !== (user[k] || ''));

  // Warn on unsaved changes navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing && hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, hasChanges]);

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) return;
    }
    setFormData({
      name:               user?.name               || '',
      phone:              user?.phone              || '',
      branch:             user?.branch             || '',
      section:            user?.section            || '',
      year:               user?.year               || '',
      registrationNumber: user?.registrationNumber || '',
      gender:             user?.gender             || '',
      linkedin:           user?.linkedin           || '',
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);
    try {
      await updateProfile({
        name:               formData.name               || undefined,
        phone:              formData.phone              || undefined,
        branch:             formData.branch             || undefined,
        section:            formData.section            || undefined,
        year:               formData.year ? Number(formData.year) : undefined,
        registrationNumber: formData.registrationNumber || undefined,
        gender:             formData.gender             || undefined,
        linkedin:           formData.linkedin           || undefined,
      });
      showToast('Profile updated successfully.', 'success');
      setIsEditing(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Sync localAvatar when store user updates
  useEffect(() => { setLocalAvatar(user?.profilePhoto || ''); }, [user?.profilePhoto]);

  // ── Avatar Upload to R2 ────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url } = res.data.data;

      const profileRes = await api.patch('/users/me', { profilePhoto: url });
      updateProfile(profileRes.data.data.user);
      setLocalAvatar(url);
      showToast('Profile photo updated!', 'success');
    } catch (err) {
      showToast('Photo upload failed. Try again.', 'error');
      console.error('[Avatar] Upload error:', err.message);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Calculate profile completion
  const fieldsToCheck = ['name', 'phone', 'gender', 'branch', 'section', 'year', 'registrationNumber'];
  const filledFields = fieldsToCheck.filter(field => !!formData[field]).length;
  const completionPercentage = Math.round((filledFields / fieldsToCheck.length) * 100);
  
  // SVG Circle Progress properties
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── Toast ────────────────────────────────────────── */}
        {toast && (
          <div
            className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm animate-in slide-in-from-bottom-5"
            style={{
              background: toast.type === 'success' ? 'rgba(6,78,59,0.95)' : 'rgba(69,10,10,0.95)',
              border: toast.type === 'success' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)',
              backdropFilter: 'blur(16px)',
              color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#34d399' }} />
              : <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#f87171' }} />
            }
            {toast.message}
          </div>
        )}

        {/* ── Page Header & Edit Toggle ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="clay-icon-box w-10 h-10" style={{ background: '#eef2ff' }}>
              <UserCog className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex">
                <BlurText text="My Profile" delay={50} animateBy="letters" direction="bottom" />
              </h1>
              <p className="text-xs font-mono mt-0.5 text-slate-500">
                Update your academic and contact information
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="clay-btn clay-btn-indigo flex items-center justify-center gap-2 font-mono font-bold px-5 py-2.5 text-xs self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>

        {/* ── Identity Card with Progress Ring ────────────── */}
        <div className="clay-card clay-indigo relative p-5 sm:p-6 mb-8 overflow-hidden">
          {/* Subtle corner glow */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
            background: 'radial-gradient(circle at top right, rgba(99,102,241,0.05) 0%, transparent 65%)',
          }} />
          
          <div className="flex items-center justify-between relative z-10 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* ── Clickable Avatar ────────────────────────── */}
              <div className="relative shrink-0 group cursor-pointer" onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg border-3 border-white"
                  style={{ border: '3px solid white' }}>
                  {localAvatar ? (
                    <img src={localAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-mono font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {initials}
                    </div>
                  )}
                </div>
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarUploading
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />
                  }
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-slate-800 truncate">{user?.name || '—'}</p>
                <p className="text-xs font-mono mt-0.5 truncate text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" /> {user?.email || '—'}
                </p>
                {/* ACE ID on mobile & desktop */}
                {user?.aceId && (
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md w-fit bg-indigo-50 border border-indigo-100/50" title="System ACE ID cannot be changed">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600">
                      {user.aceId}
                    </span>
                    <Lock className="w-2.5 h-2.5 text-indigo-300 ml-1" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion Ring */}
            <div className="relative flex flex-col items-center justify-center shrink-0 w-20 h-20 group" title={`Profile is ${completionPercentage}% complete`}>
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="rgba(226,232,240,0.8)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={completionPercentage === 100 ? '#10b981' : '#6366f1'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[13px] font-black font-mono transition-colors duration-500 ${completionPercentage === 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Contact Section */}
          <div className="clay-card clay-blue overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.9 }}>
            <div className="border-b border-blue-100/50 px-5 py-3.5 bg-blue-50/40">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-blue-500">
                Identity & Contact
              </p>
            </div>
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              {/* Full Name */}
              <Field 
                label="Full Name" 
                icon={User} 
                focused={focusState.name} 
                hasValue={!!formData.name}
              >
                <input
                  type="text"
                  placeholder={focusState.name ? "John Doe" : ""}
                  value={formData.name}
                  onChange={setField('name')}
                  disabled={!isEditing}
                  style={inputStyle(focusState.name, !isEditing)}
                  onFocus={() => setFocusState(prev => ({ ...prev, name: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, name: false }))}
                />
              </Field>

              {/* Phone */}
              <Field 
                label="Phone Number" 
                icon={Phone} 
                focused={focusState.phone} 
                hasValue={!!formData.phone}
              >
                <input
                  type="tel"
                  placeholder={focusState.phone ? "+91 98765 43210" : ""}
                  value={formData.phone}
                  onChange={setField('phone')}
                  disabled={!isEditing}
                  style={inputStyle(focusState.phone, !isEditing)}
                  onFocus={() => setFocusState(prev => ({ ...prev, phone: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, phone: false }))}
                />
              </Field>

              {/* Gender (Dropdown) */}
              <Field 
                label="Gender" 
                icon={Users} 
                focused={focusState.gender} 
                hasValue={!!formData.gender}
              >
                <select
                  value={formData.gender}
                  onChange={setField('gender')}
                  disabled={!isEditing}
                  style={{
                    ...inputStyle(focusState.gender, !isEditing),
                    cursor: !isEditing ? 'not-allowed' : 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                  onFocus={() => setFocusState(prev => ({ ...prev, gender: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, gender: false }))}
                >
                  <option value="" disabled></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 ${focusState.gender ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
              </Field>
            </div>
          </div>

          {/* Academic Section */}
          <div className="clay-card clay-purple overflow-hidden transition-all duration-300" style={{ opacity: isEditing ? 1 : 0.9 }}>
            <div className="border-b border-purple-100/50 px-5 py-3.5 bg-purple-50/40">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-purple-500">
                Academic Details
              </p>
            </div>
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">

              {/* Branch (Dropdown) */}
              <Field 
                label="Branch / Department" 
                icon={Building} 
                focused={focusState.branch} 
                hasValue={!!formData.branch}
              >
                <select
                  value={formData.branch}
                  onChange={setField('branch')}
                  disabled={!isEditing}
                  style={{
                    ...inputStyle(focusState.branch, !isEditing),
                    cursor: !isEditing ? 'not-allowed' : 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                  onFocus={() => setFocusState(prev => ({ ...prev, branch: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, branch: false }))}
                >
                  <option value="" disabled></option>
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
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 ${focusState.branch ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
              </Field>

              {/* Section (Dropdown) */}
              <Field 
                label="Section" 
                icon={BookOpen} 
                focused={focusState.section} 
                hasValue={!!formData.section}
              >
                <select
                  value={formData.section}
                  onChange={setField('section')}
                  disabled={!isEditing}
                  style={{
                    ...inputStyle(focusState.section, !isEditing),
                    cursor: !isEditing ? 'not-allowed' : 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                  onFocus={() => setFocusState(prev => ({ ...prev, section: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, section: false }))}
                >
                  <option value="" disabled></option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                  <option value="F">Section F</option>
                  <option value="NA">N/A</option>
                </select>
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 ${focusState.section ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
              </Field>

              {/* Year of Study (Dropdown) */}
              <Field 
                label="Year of Study" 
                icon={GraduationCap} 
                focused={focusState.year} 
                hasValue={!!formData.year}
              >
                <select
                  value={formData.year}
                  onChange={setField('year')}
                  disabled={!isEditing}
                  style={{
                    ...inputStyle(focusState.year, !isEditing),
                    cursor: !isEditing ? 'not-allowed' : 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                  onFocus={() => setFocusState(prev => ({ ...prev, year: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, year: false }))}
                >
                  <option value="" disabled></option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform duration-300 ${focusState.year ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
              </Field>

              {/* Roll Number */}
              <Field 
                label="Roll Number" 
                icon={Hash} 
                focused={focusState.registrationNumber} 
                hasValue={!!formData.registrationNumber}
              >
                <input
                  type="text"
                  placeholder={focusState.registrationNumber ? "21CE1A0501" : ""}
                  value={formData.registrationNumber}
                  onChange={setField('registrationNumber')}
                  disabled={!isEditing}
                  style={inputStyle(focusState.registrationNumber, !isEditing)}
                  onFocus={() => setFocusState(prev => ({ ...prev, registrationNumber: true }))}
                  onBlur={() => setFocusState(prev => ({ ...prev, registrationNumber: false }))}
                />
              </Field>
            </div>
          </div>

          {/* Social Section (Only for EBM / SBM) */}
          {(user?.role === 'ebm' || user?.role === 'sbm') && (
            <div className="clay-card clay-blue overflow-hidden transition-all duration-300 mt-8" style={{ opacity: isEditing ? 1 : 0.9 }}>
              <div className="border-b border-blue-100/50 px-5 py-3.5 bg-blue-50/40">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-blue-500">
                  Social Presence
                </p>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-1 gap-x-5 gap-y-3">
                <Field 
                  label="LinkedIn URL" 
                  icon={LinkedinIcon} 
                  focused={focusState.linkedin} 
                  hasValue={!!formData.linkedin}
                >
                  <input
                    type="url"
                    placeholder={focusState.linkedin ? "https://linkedin.com/in/username" : ""}
                    value={formData.linkedin}
                    onChange={setField('linkedin')}
                    disabled={!isEditing}
                    style={inputStyle(focusState.linkedin, !isEditing)}
                    onFocus={() => setFocusState(prev => ({ ...prev, linkedin: true }))}
                    onBlur={() => setFocusState(prev => ({ ...prev, linkedin: false }))}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Action Buttons (Only visible in Edit Mode) */}
          {isEditing && (
            <div className="flex gap-4 pt-4 sticky bottom-6 bg-white/80 p-4 -mx-4 sm:mx-0 sm:p-0 rounded-2xl backdrop-blur-md z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-none sm:bg-transparent">
              <button
                type="button"
                onClick={handleCancel}
                className="clay-btn clay-btn-white flex-1 sm:flex-none px-6 py-3.5 text-sm font-bold font-mono text-slate-600 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <X className="w-4 h-4" /> Discard
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="clay-btn clay-btn-indigo flex-1 sm:w-auto gap-2.5 font-mono font-bold px-8 py-3.5 text-sm min-h-[44px] group flex items-center justify-center"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" /> Save Changes</>
                }
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

export default MemberProfile;

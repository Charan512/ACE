import { useState } from 'react';
import { User, Phone, BookOpen, Hash, GraduationCap, Building, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, TerminalSquare } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

// ─────────────────────────────────────────────────────────────
// MEMBER PROFILE — Profile Editor (Dark Mode)
// ─────────────────────────────────────────────────────────────
const MemberProfile = () => {
  const { user, updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    phone:              user?.phone              || '',
    branch:             user?.branch             || '',
    section:            user?.section            || '',
    year:               user?.year               || '',
    registrationNumber: user?.registrationNumber || '',
  });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const setField = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        phone:              formData.phone              || undefined,
        branch:             formData.branch             || undefined,
        section:            formData.section            || undefined,
        year:               formData.year ? Number(formData.year) : undefined,
        registrationNumber: formData.registrationNumber || undefined,
      });
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, icon: Icon, children, ...props }) => (
    <div>
      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children || (
        <div className="relative">
          {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />}
          <input
            {...props}
            className={`w-full bg-black border border-slate-800 rounded-lg py-3 text-sm font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-10 max-w-3xl mx-auto bg-[#0a0a0a] min-h-[calc(100vh-4rem)] text-slate-300">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-mono font-semibold backdrop-blur-md
          ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' : 'bg-red-950/80 border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 flex items-center gap-3">
        <TerminalSquare className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-xl font-mono font-bold text-white tracking-widest uppercase">My_Profile</h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">Update parameters</p>
        </div>
      </div>

      {/* Identity Card (readonly) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl font-mono font-black text-slate-300 shrink-0 shadow-inner">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U_'}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white truncate">{user?.name || '—'}</p>
            <p className="text-slate-500 text-xs font-mono truncate">{user?.email || '—'}</p>
          </div>
          <div className="ml-auto shrink-0 hidden sm:block">
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                {user?.aceId || 'UNASSIGNED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Contact Section */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
            <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Contact_Params</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField label="Full_Name" icon={User}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-600 cursor-not-allowed"
                />
              </div>
            </InputField>

            <InputField
              label="Phone_Number"
              icon={Phone}
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={setField('phone')}
            />
          </div>
        </div>

        {/* Academic Section */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
            <h2 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Academic_Params</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField
              label="Branch/Department"
              icon={Building}
              type="text"
              placeholder="CSE, ECE, MECH…"
              value={formData.branch}
              onChange={setField('branch')}
            />
            <InputField
              label="Section"
              icon={BookOpen}
              type="text"
              placeholder="A, B, C…"
              value={formData.section}
              onChange={setField('section')}
            />

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Year_of_Study</label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  value={formData.year}
                  onChange={setField('year')}
                  className="w-full bg-black border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
                >
                  <option value="">Select year…</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <InputField
              label="Roll_Number"
              icon={Hash}
              type="text"
              placeholder="21CE1A0501"
              value={formData.registrationNumber}
              onChange={setField('registrationNumber')}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold px-8 py-3.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'UPDATING_SYS…' : 'COMMIT_CHANGES'}
        </button>
      </form>
    </div>
  );
};

export default MemberProfile;

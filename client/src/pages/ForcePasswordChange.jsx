import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ForcePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState(null);
  const [success, setSuccess]                 = useState(false);

  const navigate = useNavigate();
  const changePassword = useAuthStore((state) => state.changePassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // ── Client-side Validation ─────────────────────────────────
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      setIsLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be the same as your current temporary password.');
      setIsLoading(false);
      return;
    }

    try {
      // ── API Submission ────────────────────────────────────────
      // store.changePassword will POST /auth/change-password,
      // update Zustand, sync localstorage, and return user payload.
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      
      // Delay navigation slightly so the user reads the success message
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'ebm' || user.role === 'sbm') {
          navigate('/ops', { replace: true });
        } else {
          navigate('/member/dashboard', { replace: true });
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Password change failed. Please check your current password and try again.'
      );
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 overflow-hidden">
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-black text-slate-950 mb-3">Security Clear!</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Your password has been successfully updated. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 text-slate-200/40 pointer-events-none -rotate-12">
        <ShieldAlert className="w-80 h-80" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white p-8 sm:p-10 transition-all">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-heading font-black text-slate-950 tracking-tighter">Security Action Required</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            You must change your temporary password before accessing the ACE Portal.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Temporary Password */}
          <div>
            <label htmlFor="current-password" className="block text-sm font-bold text-slate-700 mb-2">
              Temporary / Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="current-password"
                type="password"
                required
                className="input-modern pl-12 w-full font-mono"
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="new-password"
                type="password"
                required
                className="input-modern pl-12 w-full font-mono"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="confirm-password"
                type="password"
                required
                className="input-modern pl-12 w-full font-mono"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="password-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-950 text-white font-bold text-lg py-4 px-4 rounded-xl shadow-lg shadow-slate-900/30 hover:shadow-xl hover:bg-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Update & Authenticate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;

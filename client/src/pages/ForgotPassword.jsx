import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, Lock, Hash, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Reset state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      });
      setResetSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 flex items-center justify-center px-4 pt-32 pb-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="clay-card clay-blue overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

          <div className="p-8 sm:p-10">

            {/* Icon */}
            <div className="clay-icon-box w-14 h-14 mb-6" style={{ background: '#dbeafe' }}>
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>

            {resetSuccess ? (
              /* ── Final Success State ─────────────────────── */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-heading font-black text-slate-950 mb-3">Password Reset!</h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Your password has been successfully updated. Redirecting to login...
                </p>
              </div>
            ) : sent ? (
              /* ── OTP / Reset Form State ─────────────────────── */
              <>
                <div className="flex items-center gap-3 p-4 clay-card clay-green mb-6">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">OTP Sent!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Check your inbox at <span className="font-bold">{email}</span></p>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                  Reset Password
                </h1>
                <p className="text-sm text-slate-500 mb-6">
                  Enter the 6-digit code sent to your email along with your new password.
                </p>

                {error && (
                  <div className="flex items-start gap-2.5 p-4 clay-card clay-rose mb-5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* OTP Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="clay-input w-full pl-10 pr-4 py-3 text-sm text-slate-900 font-mono tracking-widest placeholder:text-slate-400 placeholder:tracking-normal"
                      />
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="clay-input w-full pl-10 pr-12 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        tabIndex="-1"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="clay-input w-full pl-10 pr-12 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        tabIndex="-1"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6 || !newPassword}
                    className="clay-btn clay-btn-blue w-full py-3.5 text-sm gap-2 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {loading ? 'Verifying...' : 'Reset Password'}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6">
                  <button 
                    onClick={() => setSent(false)}
                    className="clay-btn clay-btn-ghost px-4 py-2 text-sm flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
                  </button>
                </div>
              </>
            ) : (
              /* ── Initial Form State ────────────────────────── */
              <>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                  Forgot Password?
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                  Enter your registered email address and we'll send you a 6-digit secure code.
                </p>

                {error && (
                  <div className="flex items-start gap-2.5 p-4 clay-card clay-rose mb-5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="clay-input w-full pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="clay-btn clay-btn-blue w-full py-3.5 text-sm gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {loading ? 'Sending...' : 'Send Recovery Code'}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6">
                  <Link to="/login"
                    className="clay-btn clay-btn-ghost px-4 py-2 text-sm flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help note */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Still having trouble? Contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

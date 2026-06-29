import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 flex items-center justify-center px-4 py-20">
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

            {sent ? (
              /* ── Success State ─────────────────────── */
              <div>
                <div className="flex items-center gap-3 p-4 clay-card clay-green mb-6">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Reset link sent!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Check your inbox at <span className="font-bold">{email}</span></p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  If an account exists with this email, you will receive a password reset link within a few minutes. Check your spam folder if you don't see it.
                </p>
                <Link to="/login"
                  className="clay-btn clay-btn-dark flex items-center justify-center gap-2 w-full py-3.5 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            ) : (
              /* ── Form State ────────────────────────── */
              <>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                  Forgot Password?
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                  Enter your registered email address and we'll send you a secure reset link.
                </p>

                {error && (
                  <div className="flex items-start gap-2.5 p-4 clay-card clay-rose mb-5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
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
                    {loading ? 'Sending...' : 'Send Reset Link'}
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

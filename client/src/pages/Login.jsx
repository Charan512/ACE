import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Fingerprint, Network, Cpu, Database, AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // ── Live API call — no mocks, no setTimeout ─────────
      // login() in useAuthStore calls POST /api/auth/login,
      // stores the JWT in localStorage, updates Zustand state,
      // and returns the user object for role-based routing.
      const user = await login(email.trim(), password);

      // ── Role-based redirect ─────────────────────────────
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'ebm' || user.role === 'sbm') {
        navigate('/ops', { replace: true });
      } else {
        navigate('/member/dashboard', { replace: true });
      }
    } catch (err) {
      // Surface the server's message (e.g. "Invalid email or password.")
      // or fall back to a generic message if the network is down.
      setError(
        err.response?.data?.message ||
        'Authentication failed. Check your credentials and try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">

      {/* Decorative Background Icons */}
      <div className="absolute top-10 left-10 text-slate-200/50 -rotate-12 pointer-events-none">
        <Network className="w-72 h-72" />
      </div>
      <div className="absolute bottom-0 right-10 text-blue-100/40 rotate-12 pointer-events-none">
        <Cpu className="w-96 h-96" />
      </div>
      <div className="absolute top-1/3 right-1/4 text-slate-200/40 rotate-45 pointer-events-none">
        <Database className="w-24 h-24" />
      </div>

      <div className="relative z-10 w-full max-w-md clay-card clay-slate animate-clay-float p-8 sm:p-10">
        <div className="mb-10 text-center">
          <Link to="/" className="text-2xl font-heading font-black tracking-tight text-slate-900 inline-block mb-2">
            SRKR <span className="text-primary">ACE</span>
          </Link>
          <h2 className="text-3xl font-heading font-black text-slate-950 mt-4 tracking-tighter">Portal Access</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Authenticate to access the command center.</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 clay-card clay-rose text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="clay-input input-modern pl-12 w-full"
                placeholder="charan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="block text-sm font-bold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
              >
                Recover Access?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="clay-input input-modern pl-12 pr-12 w-full font-mono"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 mt-2">
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="clay-btn clay-btn-dark w-full text-lg py-4 px-4"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  Authenticate
                </>
              )}
            </button>
            <p className="text-center text-sm text-slate-500 mt-6 font-medium">
              Need an ACE ID?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Apply here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In Phase Auth, this will hit our real backend endpoint
      // const response = await api.post('/auth/login', { email, password });
      // login(response.data.token, response.data.data.user);
      
      // Mocking successful login for the UI flow until backend is ready
      setTimeout(() => {
        login('mock_jwt_token_123', {
          _id: 'usr_1',
          name: 'Nalla Sri Ram Charan',
          email: email,
          role: 'admin',
          aceId: '26ACE0001'
        });
        
        // Route admin to command center, else dashboard
        navigate('/admin');
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 transition-all">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-heading font-bold tracking-tight text-slate-900 inline-block mb-2">
            SRKR <span className="text-primary">ACE</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 mt-4">Welcome Back</h2>
          <p className="text-sm text-slate-500 mt-2">Enter your credentials to access the portal.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
              placeholder="charan@srkr.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              required
              className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow-md hover:bg-primary-hover transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

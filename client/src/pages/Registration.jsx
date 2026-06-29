import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, GraduationCap, BookOpen, ShieldCheck, Zap, Code } from 'lucide-react';
import api from '../lib/api';

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    branch: '',
    year: '',
    collegeId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [membershipFee, setMembershipFee] = useState(null); // null = loading

  // Fetch current membership fee from DB (never hardcoded)
  useEffect(() => {
    fetch('/api/settings/membership-fee')
      .then(r => r.json())
      .then(d => setMembershipFee(d.data?.membershipFee ?? 500))
      .catch(() => setMembershipFee(500));
  }, []);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/payments/membership-order', formData);
      const { merchantTransactionId, redirectUrl } = response.data.data;

      sessionStorage.setItem('ace_pending_txn', merchantTransactionId);
      window.location.href = redirectUrl;
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError(
          <span>
            Account already exists. Please proceed to Login.{' '}
            <Link to="/login" className="underline font-bold hover:text-blue-800">Login here</Link>
          </span>
        );
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-3xl font-heading font-black text-slate-950 mb-4">Welcome to ACE!</h2>
          <p className="text-slate-600 mb-8 text-lg">
            Your registration was successful. Please check your email for your official ACE ID and temporary password.
          </p>
          <Link to="/login" className="btn-primary inline-block">Proceed to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">

      {/* Decorative Background Icons */}
      <div className="absolute top-20 left-10 text-slate-200/50 -rotate-12 pointer-events-none">
        <Code className="w-64 h-64" />
      </div>
      <div className="absolute bottom-10 right-10 text-blue-100/40 rotate-12 pointer-events-none">
        <Zap className="w-80 h-80" />
      </div>
      <div className="absolute top-40 right-20 text-slate-200/50 rotate-45 pointer-events-none">
        <ShieldCheck className="w-32 h-32" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white p-8 sm:p-12 transition-all">
        <div className="mb-10 text-center">
          <Link to="/" className="text-2xl font-heading font-black tracking-tight text-slate-900 inline-block mb-2">
            SRKR <span className="text-primary">ACE</span>
          </Link>
          <h2 className="text-3xl font-heading font-black text-slate-950 mt-4 tracking-tighter">Membership Application</h2>
          <p className="text-lg text-slate-500 mt-2 font-medium">Join the Association of Computer Engineers.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  required
                  className="input-modern pl-12"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
              <div className="flex gap-3">
                {['Male', 'Female'].map(option => (
                  <label
                    key={option}
                    className={`flex-1 flex items-center justify-center py-[9px] rounded-xl border cursor-pointer transition-all text-sm shadow-sm ${formData.gender === option
                      ? 'border-primary bg-blue-50 text-primary font-bold shadow-blue-100'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'
                      }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleChange}
                      className="hidden"
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  required
                  className="input-modern pl-12"
                  placeholder="johndoe@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  required
                  className="input-modern font-mono pl-12"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Branch</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <select
                  name="branch"
                  required
                  className="input-modern cursor-pointer pl-12 appearance-none bg-white"
                  value={formData.branch}
                  onChange={handleChange}
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
                {/* Custom select chevron */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Year of Study</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <select
                  name="year"
                  required
                  className="input-modern cursor-pointer pl-12 appearance-none bg-white"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {/* Custom select chevron */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* College ID (Optional) */}
          <div>
            <label htmlFor="registration-college-id" className="block text-sm font-bold text-slate-700 mb-2">
              College ID / Roll Number <span className="text-slate-400 font-normal text-xs">(Optional for Freshers - Add later in profile)</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="registration-college-id"
                type="text"
                name="collegeId"
                className="input-modern pl-12"
                placeholder="e.g. 23B91A0501"
                value={formData.collegeId}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white font-bold text-lg py-4 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:bg-primary-hover hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Proceed to Secure Payment {membershipFee !== null ? `(₹${membershipFee})` : '...'}
                </>
              )}
            </button>
            <p className="text-center text-sm text-slate-500 mt-4 font-medium">
              Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;

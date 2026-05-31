import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

const GuestCheckout = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get('type') === 'guest';
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get('/events');
        const found = res.data.data.find(e => e._id === eventId);
        if (!found) {
          setError('Event not found');
        } else {
          setEvent(found);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (import.meta.env.DEV) {
        // DEV BYPASS
        await new Promise(r => setTimeout(r, 1000));
        alert('[DEV MODE] Payment successful. You are now registered!');
        navigate('/');
        return;
      }

      // Create Razorpay Order for Guest Membership + Event
      const orderRes = await api.post('/payments/membership-order', {
        name: formData.name,
        email: formData.email,
        eventId: eventId,
      });

      const { orderId, amount, keyId } = orderRes.data.data;

      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'SRKR ACE',
        description: `Registration for ${event?.title}`,
        order_id: orderId,
        theme: { color: '#2563eb' },
        handler: function (response) {
          alert('Payment Successful! Welcome to ACE. Check your email for login details.');
          navigate('/login');
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Checkout failed.');
      setIsProcessing(false);
    }
  };

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
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-extrabold tracking-tight relative z-10 mb-2">Guest Checkout</h1>
          <p className="text-slate-400 font-medium text-sm relative z-10">
            Registering for {event.title}
          </p>
        </div>

        {/* Form area */}
        <div className="p-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">Total Amount</p>
              <p className="text-xs text-slate-500">Includes Annual ACE Membership</p>
            </div>
            <div className="text-3xl font-black text-slate-900">
              ₹{event.standardFee}
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Full Name</label>
              <input 
                type="text" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
            </button>
            <p className="text-center text-xs text-slate-400 font-medium mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure checkout via Razorpay
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckout;

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, X, Shield, Phone } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Registration Modal State
  const [isInterceptModalOpen, setIsInterceptModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.data);
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleRegistrationClick = () => {
    if (isAuthenticated) {
      navigate('/member/dashboard');
    } else {
      setIsInterceptModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Event Not Found</h2>
          <p className="text-slate-500 mb-6">The operation you are looking for does not exist or has been removed.</p>
          <Link to="/events" className="text-blue-600 font-bold hover:underline">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* 2. The Hero Banner */}
      <div className="w-full bg-gradient-to-br from-blue-50 to-slate-100 py-16 border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-start">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">
                {new Date(event.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">{event.venue || 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Standard</span>
              <span className="text-sm font-mono font-medium text-slate-600">₹{event.standardFee}</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full shadow-sm">
              <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">Member</span>
              <span className="text-sm font-mono font-bold text-white">₹{event.memberFee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Split-Scroll Body */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column (Sticky A4 Poster Placeholder) */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-28">
            <div className="w-full aspect-[29.7/21] bg-slate-200 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center shadow-lg overflow-hidden relative">
              {event.posterImage ? (
                <img src={event.posterImage} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 font-bold tracking-widest uppercase text-sm">A4 Poster Upload Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Details & Conversion) */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          <div className="prose max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Event Coordinators</h3>
            {event.coordinators && event.coordinators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.coordinators.map((coord, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
                    <span className="font-semibold text-slate-900 text-lg">{coord.name}</span>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Phone className="w-4 h-4" />
                      <span className="font-mono text-sm font-medium">{coord.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 text-center">
                <p className="text-slate-500 font-medium">Coordinators will be announced soon.</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button 
              onClick={handleRegistrationClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              Register for Event
            </button>
          </div>
        </div>
      </div>

      {/* Intercept Modal (Reused from EventsPage) */}
      {isInterceptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsInterceptModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-2">Registration Options</h3>
            <p className="text-slate-500 mb-8 font-medium">
              You are currently not logged in. ACE Members receive exclusive discounts on all operations.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/login" 
                className="w-full bg-blue-600 text-white py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
              >
                <span className="font-bold">Login as ACE Member</span>
                {event && <span className="opacity-90 font-mono text-sm">(₹{event.memberFee})</span>}
              </Link>
              
              <button 
                onClick={() => {
                  setIsInterceptModalOpen(false);
                  navigate(`/events/checkout/${event._id}?type=guest`);
                }}
                className="w-full border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Continue as Guest</span>
                  {event && <span className="opacity-75 font-mono text-sm">(₹{event.standardFee})</span>}
                </div>
                <span className="block text-xs font-medium text-slate-400">Proceed with standard non-member pricing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;

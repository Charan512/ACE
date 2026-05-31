import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Ticket, X, Shield, Phone } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInterceptModalOpen, setIsInterceptModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleRegistrationClick = (event) => {
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Trigger intercept modal
      setSelectedEvent(event);
      setIsInterceptModalOpen(true);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        // Sort chronologically (closest first)
        const sorted = (response.data.data || []).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        setEvents(sorted);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 pt-32 pb-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm tracking-wider uppercase">Loading Operations...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <Ticket className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-4xl font-heading font-black text-slate-950 tracking-tighter mb-4">No Active Operations</h1>
        <p className="text-xl text-slate-500 font-medium max-w-lg">
          No Active Operations. Our team is currently brewing the next big thing.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Background Orbs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[700px] h-[700px] bg-blue-400/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-24">
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter mb-4">Live Operations <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">Showroom.</span></h1>
          <p className="text-lg text-slate-500 font-medium">Secure your pass to our flagship technical events.</p>
        </div>

        {events.map((event, index) => (
          <div key={event._id} className="w-full mb-32 last:mb-0">
            {/* Event Header */}
            <div className="mb-12">
              <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">
                    {new Date(event.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">{event.venue || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/80 shadow-sm">
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Standard</span>
                  <span className="text-sm font-mono font-medium text-slate-600 line-through">₹{event.standardFee}</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 rounded-full shadow-md shadow-blue-500/20">
                  <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">Member</span>
                  <span className="text-sm font-mono font-bold text-white">₹{event.memberFee}</span>
                </div>
              </div>
            </div>

            {/* Split-Scroll Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column (Sticky A4 Poster Placeholder) */}
              <div className="lg:col-span-5 relative">
                <div className="sticky top-28">
                  <div className="w-full aspect-[29.7/21] bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl border-2 border-dashed border-slate-300/80 flex items-center justify-center shadow-xl overflow-hidden relative group">
                    {event.posterImage ? (
                      <img src={event.posterImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-300/50 rounded-2xl flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">A4 Poster Upload Pending</span>
                      </div>
                    )}
                    {/* Subtle corner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none rounded-3xl" />
                  </div>
                  {/* Reflection / shadow effect */}
                  <div className="h-8 mx-8 bg-slate-900/5 blur-xl rounded-full mt-1" />
                </div>
              </div>

              {/* Right Column (Details & Conversion) */}
              <div className="lg:col-span-7 flex flex-col gap-10">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Event Coordinators</h3>
                  {event.coordinators && event.coordinators.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {event.coordinators.map((coord, idx) => (
                        <div key={idx} className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200">
                          <span className="font-semibold text-slate-900 text-lg">{coord.name}</span>
                          <div className="flex items-center gap-2 text-blue-600">
                            <Phone className="w-4 h-4" />
                            <span className="font-mono text-sm font-medium">{coord.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/80 text-center">
                      <p className="text-slate-500 font-medium">Coordinators will be announced soon.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button 
                    onClick={() => handleRegistrationClick(event)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xl font-bold py-5 rounded-2xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:shadow-xl hover:-translate-y-1"
                  >
                    Register for Event
                  </button>
                </div>
              </div>
            </div>

            {index !== events.length - 1 && (
              <div className="my-24 flex items-center gap-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <div className="w-2 h-2 bg-slate-300 rounded-full" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Intercept Modal */}
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-2xl font-heading font-black text-slate-950 tracking-tight mb-2">Registration Options</h3>
            <p className="text-slate-500 mb-8 font-medium">
              You are currently not logged in. ACE Members receive exclusive discounts on all operations.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/login" 
                className="w-full bg-blue-600 text-white py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
              >
                <span className="font-bold">Login as ACE Member</span>
                {selectedEvent && <span className="opacity-90 font-mono text-sm">(₹{selectedEvent.memberFee})</span>}
              </Link>
              
              <button 
                onClick={() => {
                  setIsInterceptModalOpen(false);
                  navigate(`/events/checkout/${selectedEvent?._id}?type=guest`);
                }}
                className="w-full border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Continue as Guest</span>
                  {selectedEvent && <span className="opacity-75 font-mono text-sm">(₹{selectedEvent.standardFee})</span>}
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

export default EventsPage;

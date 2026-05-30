import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Ticket, X } from 'lucide-react';
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
        setEvents(response.data.data || []);
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
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 px-4 flex flex-col items-center justify-center text-center">
        <Ticket className="w-24 h-24 text-slate-300 mb-6" />
        <h1 className="text-4xl font-heading font-black text-slate-950 tracking-tighter mb-4">No Active Operations</h1>
        <p className="text-xl text-slate-500 font-medium max-w-lg">
          No Active Operations. Our team is currently brewing the next big thing.
        </p>
      </div>
    );
  }

  const spotlightEvent = events[0];
  const secondaryEvents = events.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter mb-4">Live Operations</h1>
          <p className="text-lg text-slate-500 font-medium">Secure your pass to the next major technical event.</p>
        </div>

        {/* Spotlight Layout (First Event) */}
        <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden mb-16 group">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Spotlight Image */}
            <div className="relative aspect-video lg:aspect-auto h-full overflow-hidden bg-slate-900">
              <img 
                src={spotlightEvent.bannerImage || "https://placehold.co/800x600/1e293b/475569?text=Spotlight+Event"} 
                alt={spotlightEvent.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity opacity-90"
              />
              <div className="absolute top-6 left-6 bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase shadow-lg">
                Featured Operation
              </div>
            </div>

            {/* Spotlight Details */}
            <div className="p-10 lg:p-14 flex flex-col justify-center">
              <h2 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter leading-tight mb-6">
                {spotlightEvent.title}
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {spotlightEvent.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Date</p>
                    <p className="text-slate-500 font-mono text-sm">{new Date(spotlightEvent.eventDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Venue</p>
                    <p className="text-slate-500 font-mono text-sm">{spotlightEvent.venue || 'TBA'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 flex items-center justify-between">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Standard</span>
                  <span className="text-slate-400 line-through font-mono font-medium text-lg">₹{(spotlightEvent.nonMemberFee / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-widest text-primary font-bold mb-1">ACE Member Pass</span>
                  <span className="text-primary font-black font-mono text-3xl">₹{(spotlightEvent.memberFee / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={() => handleRegistrationClick(spotlightEvent)}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" /> Proceed to Registration
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Grid */}
        {secondaryEvents.length > 0 && (
          <>
            <h3 className="text-2xl font-heading font-black text-slate-950 tracking-tighter mb-8">Upcoming Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {secondaryEvents.map((event) => (
                <div key={event._id} className="relative group bg-slate-950 rounded-[2rem] overflow-hidden shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col h-[450px]">
                  
                  {/* Image Block (60%) */}
                  <div className="relative h-[60%] w-full overflow-hidden bg-slate-800">
                    <img 
                      src={event.bannerImage || `https://placehold.co/600x600/1e293b/475569?text=${encodeURIComponent(event.title)}`}
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity opacity-80" 
                    />
                    
                    {/* Floating Pricing Badge */}
                    <div className="absolute -bottom-5 right-6 bg-primary text-white px-5 py-2.5 rounded-full font-black text-lg shadow-xl shadow-primary/30 z-10 border-4 border-slate-950 flex flex-col items-center leading-none">
                      <span className="text-[0.6rem] uppercase tracking-widest text-blue-200 mb-0.5">ACE Member</span>
                      ₹{(event.memberFee / 100).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* High Contrast Content Block (Bottom 40%) */}
                  <div className="relative flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight line-clamp-1">{event.title}</h4>
                      <p className="text-slate-400 text-sm font-medium mt-2 line-clamp-2">{event.description}</p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <div className="font-mono text-xs text-slate-500">
                        <span className="block mb-1">{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span>{event.venue || 'TBA'}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="block text-[0.65rem] text-slate-500 uppercase font-bold tracking-wider mb-1">Standard</span>
                        <span className="text-slate-400 line-through font-mono font-medium text-sm">₹{(event.nonMemberFee / 100).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
              You are currently not logged in. ACE Members receive exclusive discounts on all events.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/login" 
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary-hover transition-colors text-center"
              >
                Login as ACE Member
              </Link>
              
              <button 
                onClick={() => {
                  alert(`Proceeding to guest checkout for ${selectedEvent?.title}`);
                  setIsInterceptModalOpen(false);
                }}
                className="w-full border-2 border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center"
              >
                <span>Continue as Guest</span>
                <span className="block text-xs font-medium text-slate-400 mt-0.5">Proceed with standard non-member pricing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;

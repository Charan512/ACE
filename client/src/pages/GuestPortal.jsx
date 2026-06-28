import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Terminal, Shield, Zap, Users, MapPin, Calendar, Phone, X } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const GuestPortal = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInterceptModalOpen, setIsInterceptModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        // Sort by closest upcoming event
        const sortedEvents = (response.data.data || []).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegistrationClick = (event) => {
    if (isAuthenticated) {
      navigate('/member/dashboard');
    } else {
      setSelectedEvent(event);
      setIsInterceptModalOpen(true);
    }
  };

  const upcomingEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="bg-slate-50 overflow-hidden">

      {/* 1. The Hero Section */}
      <section className="min-h-[90vh] flex flex-col justify-center relative overflow-hidden bg-white">
        {/* Ambient Background Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto px-6 w-full relative z-10 pt-40 pb-20">

          {/* Left Column (col-span-7) */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
            <p className="text-xs sm:text-sm font-bold tracking-widest text-blue-600 uppercase mb-5">SRKR Engineering College · Dept. of CSE</p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tighter leading-[1] lg:leading-[0.9] text-slate-900 mb-6">
              Empower Your <br className="hidden sm:block lg:hidden" /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">Engineering.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-lg leading-relaxed mb-10">
              The official technical club of SRKR Engineering College. Build real systems, compete in hackathons, and grow your network.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-12 w-full sm:w-auto px-4 sm:px-0">
              <Link to="/register" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-1 text-center">
                Join the Club
              </Link>
              <Link to="/events" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-slate-400 hover:text-slate-900 transition-all shadow-sm text-center">
                Explore Events →
              </Link>
            </div>
          </div>

          {/* Right Column (col-span-5 hidden lg:block) */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="grid grid-cols-2 gap-4 h-[450px] w-full">
              <div className="col-span-1 row-span-2 bg-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop" alt="Hackathon Event" className="w-full h-full object-cover" />
              </div>
              <div className="col-span-1 row-span-1 bg-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop" alt="Artificial Intelligence" className="w-full h-full object-cover" />
              </div>
              <div className="col-span-1 row-span-1 bg-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" alt="ACE Team" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

        </div>

        {/* The Marquee — subtle light mode ticker */}
        <div className="absolute bottom-0 left-0 w-full whitespace-nowrap overflow-hidden bg-slate-100 border-t border-slate-200 text-slate-400 py-2.5 font-mono text-xs font-semibold tracking-widest flex z-20">
          <div className="animate-marquee flex gap-12">
            <span>ARTIFICIAL INTELLIGENCE &nbsp;·&nbsp; WEB3 &amp; BLOCKCHAIN &nbsp;·&nbsp; CYBER SECURITY &nbsp;·&nbsp; CLOUD COMPUTING &nbsp;·&nbsp; MACHINE LEARNING &nbsp;·&nbsp; </span>
            <span>ARTIFICIAL INTELLIGENCE &nbsp;·&nbsp; WEB3 &amp; BLOCKCHAIN &nbsp;·&nbsp; CYBER SECURITY &nbsp;·&nbsp; CLOUD COMPUTING &nbsp;·&nbsp; MACHINE LEARNING &nbsp;·&nbsp; </span>
            <span>ARTIFICIAL INTELLIGENCE &nbsp;·&nbsp; WEB3 &amp; BLOCKCHAIN &nbsp;·&nbsp; CYBER SECURITY &nbsp;·&nbsp; CLOUD COMPUTING &nbsp;·&nbsp; MACHINE LEARNING &nbsp;·&nbsp; </span>
          </div>
        </div>
      </section>

      {/* Spotlight Banner */}
      {upcomingEvent && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Next Major Operation</h2>
            <p className="text-lg text-slate-500">Secure your pass to our upcoming flagship event.</p>
          </div>
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between shadow-xl mb-16 gap-6 md:gap-0">
            <div className="text-white text-center md:text-left">
              <h3 className="text-3xl font-bold mb-2">{upcomingEvent.title}</h3>
              <p className="text-slate-400 font-medium">Date: {new Date(upcomingEvent.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <Link
              to={`/events/${upcomingEvent._id}`}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md whitespace-nowrap"
            >
              View Event Details
            </Link>
          </div>
        </section>
      )}

      {/* 3. The Mission Section (Bento Box Grid) */}
      <section id="about" className="max-w-7xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">

          {/* Card 1 (The Main Feature) */}
          <div className="md:col-span-2 md:row-span-2 bg-slate-900 text-white p-6 md:p-10 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <Cpu className="absolute -bottom-8 -right-8 w-48 h-48 md:w-64 md:h-64 text-slate-800 opacity-50 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-3xl md:text-4xl font-heading font-black mb-4 relative z-10 tracking-tight">Hands-on Workshops</h3>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed relative z-10 max-w-sm">
              We bypass tutorials and dive straight into production-grade systems. Build deep-tech projects, neural networks, and scalable infrastructure with our core engineering team.
            </p>
          </div>

          {/* Card 2 (Top Right) */}
          <div className="md:col-span-2 md:row-span-1 bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
              <div>
                <h4 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Competitive Hackathons</h4>
                <p className="text-slate-500 font-medium">Test your skills in flagship 24-hour development sprints like Prajwalan. Compete, build, and win massive prizes.</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Terminal className="w-6 h-6 text-slate-900" />
              </div>
            </div>
          </div>

          {/* Card 3 (Bottom Right) */}
          <div className="md:col-span-2 md:row-span-1 bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-3xl hover:bg-blue-100 transition-colors">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
              <div>
                <h4 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Peer Networking</h4>
                <p className="text-slate-600 font-medium">Connect with top-tier developers, alumni, and industry professionals. The network is your ultimate utility.</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Department & Faculty (The Structural Split) */}
      <section id="department" className="w-full bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-black tracking-tighter mb-6">Powered by the Dept. of CSE</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            SRKR ACE operates in direct synergy with the Computer Science & Engineering department,
            bridging the massive gap between academic curriculum and cutting-edge industry practices.
          </p>
          <a
            href="https://www.srkrcse.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-slate-900 transition-all shadow-sm"
          >
            Visit CSE Dept <span>→</span>
          </a>
        </div>
      </section>

      {/* Faculty Leadership Grid */}
      <section id="faculty" className="w-full bg-white py-24 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter">Faculty Leadership.</h2>
            <p className="mt-4 text-slate-500 text-lg font-medium max-w-xl mx-auto">The academic visionaries guiding the association.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* HOD Profile */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" alt="Dr. Bh. V. S. R. K. Raju" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. Bh. V. S. R. K. Raju</h4>
              <p className="text-primary font-bold tracking-wide text-sm uppercase">Head of Department</p>
            </div>

            {/* Coordinator Profile 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" alt="Dr. V. Chandrasekhar" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. V. Chandrasekhar</h4>
              <p className="text-slate-500 font-bold tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>

            {/* Coordinator Profile 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" alt="Hemalatha" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Hemalatha</h4>
              <p className="text-slate-500 font-bold tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Visual Archives (Gallery) */}
      <section id="gallery" className="py-24 bg-slate-950 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tighter">Visual Archives.</h2>
              <p className="mt-4 text-slate-400 text-lg font-medium max-w-xl">Glimpses into our high-stakes hackathons, workshops, and late-night coding sessions.</p>
            </div>
            <Link to="/events" className="text-primary font-bold hover:text-white transition-colors underline-offset-4 hover:underline whitespace-nowrap">
              View All Operations →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] sm:auto-rows-[200px] md:auto-rows-[250px]">
            {/* Large Image (Spans 2 cols, 2 rows) */}
            <div className="col-span-2 row-span-2 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            {/* Standard Images */}
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
          </div>
        </div>
      </section>

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

export default GuestPortal;

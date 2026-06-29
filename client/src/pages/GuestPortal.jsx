import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Terminal, Shield, Zap, Users, MapPin, Calendar, Phone, X, Star } from 'lucide-react';
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
    <div className="bg-[#fcfdfd] overflow-hidden font-sans">

      {/* ── 1. The Playful Hero Section ── */}
      <section className="min-h-[95vh] flex flex-col justify-center relative overflow-hidden">
        {/* Soft Pastel Background Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-200/40 rounded-full blur-[80px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-pink-300/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-300/30 rounded-full blur-[80px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto px-6 w-full relative z-10 pt-32 pb-20">

          {/* Left Column */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start relative">

            {/* Playful Floating Badges */}
            <div className="absolute -top-10 -left-6 transform -rotate-12 animate-pulse hidden md:block">
              <div className="clay-card clay-yellow px-4 py-2 font-black text-amber-700 text-sm rotate-3 flex items-center gap-2">
                <Star className="w-4 h-4" /> Fun Tech!
              </div>
            </div>

            <p className="clay-card clay-blue inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-widest text-blue-700 uppercase mb-6 shadow-sm">
              SRKR Engineering College · CSE
            </p>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] text-slate-900 mb-8 drop-shadow-sm">
              Build Cool <br className="hidden sm:block lg:hidden" />
              <span className="text-indigo-600">Stuff.</span>
            </h1>

            <p className="text-lg sm:text-2xl text-slate-600 font-bold max-w-lg leading-relaxed mb-10">
              The official tech club of SRKR. Learn deeply, build wildly, and meet awesome people.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-5 mb-12 w-full sm:w-auto px-4 sm:px-0">
              <Link to="/register" className="clay-btn clay-btn-amber px-10 py-5 text-xl w-full sm:w-auto">
                Join the Club
              </Link>
              <Link to="/events" className="clay-btn clay-btn-ghost px-10 py-5 text-xl w-full sm:w-auto border-4 border-slate-200">
                Explore Events
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Clay Polaroids */}
          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="relative h-[500px] w-full">
              {/* Image 1 */}
              <div className="absolute top-0 right-10 w-64 h-64 clay-card clay-pink p-3 z-20 rotate-6 hover:rotate-0 transition-transform duration-300">
                <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop" alt="Hackathon" className="w-full h-full object-cover rounded-[1rem]" />
              </div>
              {/* Image 2 */}
              <div className="absolute bottom-10 left-0 w-72 h-56 clay-card clay-cyan p-3 z-30 -rotate-3 hover:rotate-0 transition-transform duration-300">
                <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop" alt="AI" className="w-full h-full object-cover rounded-[1rem]" />
              </div>
              {/* Image 3 */}
              <div className="absolute top-32 left-10 w-56 h-56 clay-card clay-lime p-3 z-10 -rotate-12 hover:rotate-0 transition-transform duration-300">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" alt="Team" className="w-full h-full object-cover rounded-[1rem]" />
              </div>
            </div>
          </div>

        </div>

        {/* ── Playful Marquee ── */}
        <div className="absolute bottom-0 left-0 w-full whitespace-nowrap overflow-hidden clay-yellow py-3 font-black text-amber-700 text-sm tracking-widest flex z-20 shadow-inner">
          <div className="animate-marquee flex items-center gap-12 drop-shadow-md">
            <div className="flex items-center gap-2"><Cpu className="w-4 h-4" /> ARTIFICIAL INTELLIGENCE</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4" /> WEB3 &amp; BLOCKCHAIN</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> CYBER SECURITY</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> CLOUD COMPUTING</div>
            <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> MACHINE LEARNING</div>

            <div className="flex items-center gap-2"><Cpu className="w-4 h-4" /> ARTIFICIAL INTELLIGENCE</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4" /> WEB3 &amp; BLOCKCHAIN</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> CYBER SECURITY</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> CLOUD COMPUTING</div>
            <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> MACHINE LEARNING</div>
          </div>
        </div>
      </section>

      {/* ── 2. Next Major Event (Spotlight) ── */}
      {upcomingEvent && (
        <section className="max-w-7xl mx-auto px-6 py-20 relative z-30">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2 drop-shadow-sm">Next Big Thing!</h2>
            <p className="text-xl font-bold text-slate-500">Don't miss out on our upcoming operation.</p>
          </div>
          <div className="clay-card clay-indigo p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/30 rounded-full blur-2xl"></div>
            <div className="text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-indigo-700 font-black text-sm mb-4">
                <Calendar className="w-4 h-4" />
                {new Date(upcomingEvent.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <h3 className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 tracking-tight leading-tight drop-shadow-sm">{upcomingEvent.title}</h3>
              <p className="text-indigo-900/80 font-bold text-lg max-w-lg">Get your passes now and join the fun!</p>
            </div>
            <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
              <Link
                to={`/events/${upcomingEvent._id}`}
                className="clay-btn clay-btn-blue px-10 py-4 text-lg whitespace-nowrap w-full"
              >
                Event Details
              </Link>
              <button
                onClick={() => handleRegistrationClick(upcomingEvent)}
                className="clay-btn clay-btn-amber px-10 py-4 text-lg whitespace-nowrap w-full"
              >
                Register Now
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Bento Box (Mission) ── */}
      <section id="about" className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">

          {/* Hands-on Workshops */}
          <div className="clay-card clay-rose md:col-span-2 md:row-span-2 p-8 md:p-12 relative overflow-hidden group">
            <Cpu className="absolute -bottom-8 -right-8 w-48 h-48 md:w-64 md:h-64 text-rose-500/20 group-hover:rotate-12 transition-transform duration-700" />
            <div className="clay-icon-box w-16 h-16 bg-white/60 mb-6 flex items-center justify-center rounded-2xl shadow-sm">
              <Zap className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-4xl md:text-5xl font-black mb-4 relative z-10 tracking-tight text-slate-900 drop-shadow-sm">Hands-on<br />Workshops</h3>
            <p className="text-rose-900/70 font-bold text-lg leading-relaxed relative z-10 max-w-sm">
              We bypass boring tutorials and dive straight into building fun, production-grade systems!
            </p>
          </div>

          {/* Competitive Hackathons */}
          <div className="clay-card clay-purple md:col-span-2 md:row-span-1 p-6 md:p-8 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight drop-shadow-sm">Hackathons</h4>
              <p className="text-purple-900/70 font-bold">Code, compete, and win massive prizes in our 24-hour sprints!</p>
            </div>
            <div className="clay-icon-box w-14 h-14 shrink-0 bg-white/60 flex items-center justify-center rounded-2xl shadow-sm">
              <Terminal className="w-7 h-7 text-purple-600" />
            </div>
          </div>

          {/* Peer Networking */}
          <div className="clay-card clay-lime md:col-span-2 md:row-span-1 p-6 md:p-8 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight drop-shadow-sm">Peer Network</h4>
              <p className="text-lime-900/80 font-bold">Hang out and connect with awesome developers and alumni.</p>
            </div>
            <div className="clay-icon-box w-14 h-14 shrink-0 bg-white/60 flex items-center justify-center rounded-2xl shadow-sm">
              <Users className="w-7 h-7 text-lime-700" />
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Department Section ── */}
      <section id="department" className="relative w-full py-24 px-6 overflow-hidden mt-10">
        {/* Restored Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://www.srkrcse.com/assets/images/cse.jpg)' }}
        />
        <div className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-sm" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="clay-card inline-block px-8 py-5 mb-8 rotate-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 drop-shadow-sm">Powered by Dept. of CSE</h2>
          </div>
          <p className="text-slate-100 text-xl leading-relaxed mb-10 max-w-2xl mx-auto font-bold drop-shadow-sm">
            ACE operates in direct synergy with the Computer Science & Engineering department, bridging the gap between academics and the industry.
          </p>
          <a
            href="https://www.srkrcse.com"
            target="_blank"
            rel="noreferrer"
            className="clay-btn clay-btn-amber px-8 py-4 text-lg"
          >
            Visit CSE Dept
          </a>
        </div>
      </section>

      {/* ── 5. Faculty Leadership Grid (Restored) ── */}
      <section id="faculty" className="w-full bg-[#fcfdfd] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tighter drop-shadow-sm">Faculty Leadership.</h2>
            <p className="mt-4 text-slate-500 text-lg font-bold max-w-xl mx-auto">The academic visionaries guiding the association.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* HOD Profile */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-[2rem] mb-6 overflow-hidden clay-card clay-indigo p-2 group-hover:rotate-3 transition-transform duration-500">
                <img src="https://www.srkrcse.com/assets/images/hod.jpeg" alt="Dr. Bh. V. S. R. K. Raju" className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. Bh. V. S. R. K. Raju</h4>
              <p className="text-indigo-600 font-black tracking-wide text-sm uppercase">Head of Department</p>
            </div>

            {/* Coordinator Profile 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-[2rem] mb-6 overflow-hidden clay-card clay-pink p-2 group-hover:-rotate-3 transition-transform duration-500">
                <img src="https://media.licdn.com/dms/image/v2/D5603AQFrj6FLnXzMVw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1731385903614?e=1784160000&v=beta&t=AXXXjNVEmhVfv1EOQ2bzdFQIV6sOPz8VGNaUw-AFfwk" alt="Dr. V. Chandrasekhar" className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. V. Chandrasekhar</h4>
              <p className="text-pink-600 font-black tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>

            {/* Coordinator Profile 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-[2rem] mb-6 overflow-hidden clay-card clay-lime p-2 group-hover:rotate-3 transition-transform duration-500">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" alt="Hemalatha" className="w-full h-full object-cover rounded-[1.5rem]" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Hemalatha</h4>
              <p className="text-lime-700 font-black tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. The Visual Archives (Gallery) (Restored & Enhanced) ── */}
      <section id="gallery" className="py-24 bg-slate-950 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Visual Archives.</h2>
              <p className="mt-4 text-slate-400 text-lg font-bold max-w-xl">Glimpses into our high-stakes hackathons, workshops, and late-night coding sessions.</p>
            </div>
            <Link to="/events" className="text-indigo-400 font-black hover:text-white transition-colors underline-offset-4 hover:underline whitespace-nowrap">
              View All Operations →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] sm:auto-rows-[200px] md:auto-rows-[250px]">
            {/* Large Image (Spans 2 cols, 2 rows) */}
            <div className="col-span-2 row-span-2 rounded-[2rem] overflow-hidden group relative border-4 border-slate-800 hover:border-indigo-500 transition-colors">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
            </div>
            {/* Standard Images */}
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative border-4 border-slate-800 hover:border-pink-500 transition-colors">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative border-4 border-slate-800 hover:border-amber-500 transition-colors">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative border-4 border-slate-800 hover:border-lime-500 transition-colors">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
            </div>
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative border-4 border-slate-800 hover:border-cyan-500 transition-colors">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Intercept Modal ── */}
      {isInterceptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="clay-card clay-white max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setIsInterceptModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 clay-card clay-blue flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>

            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Wait a sec!</h3>
            <p className="text-slate-500 mb-8 font-bold text-lg">
              ACE Members get exclusive discounts and fast-pass access.
            </p>

            <div className="flex flex-col gap-4">
              <Link
                to="/login"
                className="clay-btn clay-btn-blue py-4 w-full text-lg"
              >
                Login as Member {selectedEvent && <span className="opacity-90 font-mono text-sm ml-2">(₹{selectedEvent.memberFee})</span>}
              </Link>

              <button
                onClick={() => {
                  setIsInterceptModalOpen(false);
                  navigate(`/events/checkout/${selectedEvent?._id}?type=guest`);
                }}
                className="clay-btn clay-btn-ghost border-4 py-4 w-full flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-2 text-lg">
                  Continue as Guest {selectedEvent && <span className="opacity-75 font-mono text-sm">(₹{selectedEvent.standardFee})</span>}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuestPortal;

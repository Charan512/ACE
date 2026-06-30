import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, Zap, Terminal, Code2, Globe, Shield, Cpu, ArrowRight, Star, X } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/useAuthStore';

const GuestPortal = () => {
  const navigate = useNavigate();
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const [isInterceptModalOpen, setIsInterceptModalOpen] = useState(false);

  useEffect(() => {
    // Fetch the latest upcoming event to feature on the hero
    const fetchLatestEvent = async () => {
      try {
        const res = await api.get('/events?status=upcoming&sort=eventDate&limit=1');
        const events = res.data.data || [];
        if (events.length > 0) {
          setUpcomingEvent(events[0]);
        }
      } catch (err) {
        console.error('Failed to fetch latest event:', err);
      }
    };
    fetchLatestEvent();
  }, []);

  const handleRegistrationClick = (event) => {
    if (isAuthenticated) {
      navigate('/member/dashboard');
    } else {
      setIsInterceptModalOpen(true);
    }
  };

  return (
    <div className="bg-[#FFFDF6] overflow-hidden font-sans min-h-screen text-slate-900">

      {/* ── 1. Neo-Brutalism Hero Section ── */}
      <section className="min-h-[95vh] flex flex-col justify-center relative overflow-hidden">
        {/* Background Grids / Shapes */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Graph Paper Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#0f172a 2px, transparent 2px), linear-gradient(90deg, #0f172a 2px, transparent 2px)',
            backgroundSize: '48px 48px',
            opacity: 0.06
          }} />

          {/* Plus / Cross Accents */}
          <div className="absolute top-[45%] left-[25%] text-slate-900 opacity-20 font-black text-5xl select-none">+</div>
          <div className="absolute top-[35%] right-[40%] text-slate-900 opacity-20 font-black text-4xl select-none">+</div>
          <div className="absolute bottom-[25%] right-[25%] text-slate-900 opacity-10 font-black text-8xl select-none leading-none">*</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto px-6 w-full relative z-10 pt-32 pb-20">

          {/* Left Column */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start relative">

            {/* Playful Stickers */}
            <div className="absolute -top-10 -left-6 transform -rotate-12 hidden md:block">
              <div className="brutal-badge brutal-yellow px-4 py-2 text-amber-900 text-sm rotate-3 flex items-center gap-2">
                <Star className="w-4 h-4" /> TRENDING
              </div>
            </div>

            <div className="absolute top-20 right-0 transform rotate-12 hidden lg:block">
              <div className="brutal-badge brutal-pink px-4 py-2 text-white text-sm -rotate-6 flex items-center gap-2">
                <Code2 className="w-4 h-4" /> EST. 2006
              </div>
            </div>

            <p className="brutal-badge brutal-white px-4 py-1.5 text-xs sm:text-sm text-slate-900 mb-6">
              SRKR Engineering College · CSE
            </p>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] text-slate-900 mb-8 uppercase">
              Ignite <br className="hidden sm:block lg:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600" style={{ WebkitTextStroke: '3px #0f172a', WebkitTextFillColor: '#fff' }}>Innovation.</span>
            </h1>

            <p className="text-lg sm:text-2xl text-slate-800 font-bold max-w-lg leading-relaxed mb-10 border-l-4 border-slate-900 pl-4 ml-2">
              The official student club to ignite passion on tech and guide innovations.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-5 mb-12 w-full sm:w-auto px-4 sm:px-0">
              <Link to="/register" className="brutal-btn brutal-cyan px-10 py-5 text-xl w-full sm:w-auto text-slate-900">
                Join the Club
              </Link>
              <Link to="/team" className="brutal-btn brutal-white px-8 py-5 text-lg w-full sm:w-auto text-slate-900">
                Meet the Team
              </Link>
            </div>
          </div>

          {/* Right Column - Featured Event */}
          <div className="lg:col-span-5 relative mt-10 lg:mt-0 w-full max-w-md mx-auto">
            {upcomingEvent ? (
              <div className="brutal-card brutal-yellow p-8 relative transform hover:rotate-2">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 rounded-full border-4 border-slate-900 flex items-center justify-center animate-pulse z-20">
                  <Star className="w-6 h-6 text-white" />
                </div>

                <div className="text-center md:text-left relative z-10">
                  <div className="inline-flex items-center gap-2 brutal-badge brutal-white px-4 py-1.5 text-slate-900 mb-4">
                    <Calendar className="w-4 h-4" />
                    {new Date(upcomingEvent.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 tracking-tight leading-tight uppercase">{upcomingEvent.title}</h3>
                  <p className="text-slate-800 font-bold text-lg mb-8 line-clamp-2">
                    {upcomingEvent.description}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleRegistrationClick(upcomingEvent)}
                      className="brutal-btn brutal-pink px-8 py-4 text-lg w-full"
                    >
                      Register Now <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                    <Link
                      to={`/events/${upcomingEvent._id}`}
                      className="brutal-btn brutal-white px-8 py-4 text-lg w-full"
                    >
                      Event Details
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="brutal-card brutal-lime p-8 text-center rotate-3">
                <div className="w-20 h-20 bg-white border-[3px] border-slate-900 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Terminal className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-3xl font-black mb-2 uppercase">No Upcoming Events</h3>
                <p className="text-slate-800 font-bold text-lg mb-6">Check back soon for hackathons and workshops!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Playful Marquee ── */}
        <div className="absolute bottom-0 left-0 w-full whitespace-nowrap overflow-hidden bg-rose-400 border-t-[3px] border-slate-900 py-3 font-black text-slate-900 text-lg tracking-widest flex z-20">
          <div className="animate-marquee flex items-center gap-12">
            <div className="flex items-center gap-2"><Cpu className="w-5 h-5" /> ARTIFICIAL INTELLIGENCE</div>
            <div className="flex items-center gap-2"><Star className="w-5 h-5" /> WEB3 &amp; BLOCKCHAIN</div>
            <div className="flex items-center gap-2"><Shield className="w-5 h-5" /> CYBER SECURITY</div>
            <div className="flex items-center gap-2"><Zap className="w-5 h-5" /> CLOUD COMPUTING</div>
            <div className="flex items-center gap-2"><Terminal className="w-5 h-5" /> MACHINE LEARNING</div>

            <div className="flex items-center gap-2"><Cpu className="w-5 h-5" /> ARTIFICIAL INTELLIGENCE</div>
            <div className="flex items-center gap-2"><Star className="w-5 h-5" /> WEB3 &amp; BLOCKCHAIN</div>
            <div className="flex items-center gap-2"><Shield className="w-5 h-5" /> CYBER SECURITY</div>
            <div className="flex items-center gap-2"><Zap className="w-5 h-5" /> CLOUD COMPUTING</div>
            <div className="flex items-center gap-2"><Terminal className="w-5 h-5" /> MACHINE LEARNING</div>
          </div>
        </div>
      </section>

      {/* ── 2. The Sandbox (What We Do) ── */}
      <section id="about" className="py-24 sm:py-32 relative z-10 border-t-[3px] border-slate-900 bg-sky-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center brutal-badge brutal-white px-6 py-2 mb-6">
              <Terminal className="w-5 h-5 mr-2" /> WHAT WE DO
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase">
              The Ultimate Sandbox
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="brutal-card brutal-pink p-8 sm:p-10 relative group">
              <div className="w-16 h-16 bg-white border-[3px] border-slate-900 mb-6 flex items-center justify-center rounded-xl shadow-[4px_4px_0_0_#0f172a] transform -rotate-6">
                <Zap className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-white">Hands-on<br />Workshops</h3>
              <p className="text-white font-bold text-lg leading-relaxed">
                We bypass boring tutorials and dive straight into building fun, production-grade systems!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="brutal-card brutal-yellow p-8 sm:p-10 relative group md:-translate-y-8">
              <div className="w-16 h-16 bg-white border-[3px] border-slate-900 mb-6 flex items-center justify-center rounded-xl shadow-[4px_4px_0_0_#0f172a] transform rotate-3">
                <Users className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-slate-900">Community<br />Driven</h3>
              <p className="text-slate-800 font-bold text-lg leading-relaxed">
                Peer-to-peer learning, intense hackathons, and networking with absolute wizards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="brutal-card brutal-white p-8 sm:p-10 relative group">
              <div className="w-16 h-16 bg-lime-400 border-[3px] border-slate-900 mb-6 flex items-center justify-center rounded-xl shadow-[4px_4px_0_0_#0f172a] transform -rotate-3">
                <Globe className="w-8 h-8 text-slate-900" />
              </div>
              <h3 className="text-3xl font-black mb-4 uppercase text-slate-900">Skill<br />Building</h3>
              <p className="text-slate-800 font-bold text-lg leading-relaxed">
                Get the mentorship and hands-on guidance you need to rapidly level up your technical skill set.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Department Section ── */}
      <section id="department" className="relative py-32 sm:py-40 border-t-[3px] border-slate-900">
        <div className="absolute inset-0 z-0 opacity-40 grayscale sepia bg-blend-multiply bg-amber-200"
          style={{ backgroundImage: 'url(https://www.srkrcse.com/assets/images/cse.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 z-0 bg-slate-900/60" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">

            {/* HOD Profile */}
            <div className="flex flex-col items-center text-center group shrink-0">
              <div className="w-56 sm:w-64 aspect-square rounded-2xl mb-6 overflow-hidden brutal-card brutal-purple p-0 group-hover:scale-105 transition-transform duration-200">
                <img src="https://www.srkrcse.com/assets/images/hod.jpeg" alt="Dr. Bh. V. S. R. K. Raju" className="w-full h-full object-cover border-b-[3px] border-slate-900" />
              </div>
              <h4 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Dr. Bh. V. S. R. K. Raju</h4>
              <p className="brutal-badge brutal-lime px-3 py-1 text-slate-900">Head of Department</p>
            </div>

            {/* Text Side */}
            <div className="flex-1 text-center md:text-left">
              <div className="brutal-badge brutal-lime px-8 py-4 mb-8 -rotate-2 inline-block">
                <h2 className="text-3xl sm:text-5xl font-black uppercase text-slate-900">Powered by Dept. of CSE</h2>
              </div>
              <p className="text-xl sm:text-2xl text-white font-bold leading-relaxed bg-slate-900/80 p-6 rounded-xl border-[3px] border-slate-900 shadow-[6px_6px_0_0_#a3e635] mb-8">
                Backed by the legacy of the Computer Science and Engineering Department at SRKR Engineering College.
                We bridge the gap between academic theory and bleeding-edge industry practice.
              </p>
              <a href="https://www.srkrcse.com/" target="_blank" rel="noopener noreferrer" className="brutal-btn brutal-white px-8 py-4 text-lg text-slate-900 inline-flex items-center">
                Visit CSE Department <Globe className="w-5 h-5 ml-2" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Faculty Leadership ── */}
      <section id="faculty" className="py-24 sm:py-32 relative z-10 bg-[#FFFDF6] border-t-[3px] border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase">
              Faculty Coordinators
            </h2>
            <div className="h-2 w-32 bg-slate-900 mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">

            {/* Coordinator Profile 1 */}
            <div className="flex flex-col items-center text-center group h-full">
              <div className="w-56 aspect-square rounded-2xl mb-6 overflow-hidden brutal-card brutal-cyan p-0 group-hover:rotate-3 transition-transform duration-200 shrink-0">
                <img src="https://media.licdn.com/dms/image/v2/D5603AQFrj6FLnXzMVw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1731385903614?e=1784160000&v=beta&t=AXXXjNVEmhVfv1EOQ2bzdFQIV6sOPz8VGNaUw-AFfwk" alt="Dr. V. Chandrasekhar" className="w-full h-full object-cover border-b-[3px] border-slate-900" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Dr. V. Chandrasekhar</h4>
              <div className="mt-auto flex flex-col items-center gap-1.5">
                <p className="brutal-badge brutal-white px-3 py-1 text-slate-900 text-sm">Assistant Professor</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept. of CSE</p>
              </div>
            </div>

            {/* Coordinator Profile 2 */}
            <div className="flex flex-col items-center text-center group h-full">
              <div className="w-56 aspect-square rounded-2xl mb-6 overflow-hidden brutal-card brutal-lime p-0 group-hover:-rotate-3 transition-transform duration-200 shrink-0">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop" alt="Hemalatha" className="w-full h-full object-cover border-b-[3px] border-slate-900" />
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Smt. Hemalatha</h4>
              <div className="mt-auto flex flex-col items-center gap-1.5">
                <p className="brutal-badge brutal-white px-3 py-1 text-slate-900 text-sm">Assistant Professor</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept. of CSE</p>
              </div>
            </div>

            {/* Coordinator Profile 3 */}
            <div className="flex flex-col items-center text-center group h-full">
              <div className="w-56 aspect-square rounded-2xl mb-6 overflow-hidden brutal-card brutal-purple p-0 flex items-center justify-center bg-purple-100 group-hover:scale-105 transition-transform duration-200 shrink-0">
                {/* Empty spot / placeholder avatar */}
                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-fuchsia-200 flex items-center justify-center border-b-[3px] border-slate-900">
                  <span className="text-6xl font-black text-purple-900/40">HK</span>
                </div>
              </div>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Hari Krishna</h4>
              <div className="mt-auto flex flex-col items-center gap-1.5">
                <p className="brutal-badge brutal-white px-3 py-1 text-slate-900 text-sm">Assistant Professor</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept. of CSE</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Visual Archives / Gallery ── */}
      <section id="gallery" className="py-24 sm:py-32 relative z-10 bg-slate-900 border-t-[3px] border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-lime-400 uppercase drop-shadow-[4px_4px_0_#fff]">
              Visual Archives
            </h2>
            <p className="text-white font-bold text-xl mt-6">Moments captured from our chaotic hackathons and events.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 auto-rows-[250px]">
            {/* Gallery Image 1 */}
            <div className="col-span-2 row-span-2 brutal-card brutal-white p-0 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop" alt="Hackathon Event" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            {/* Gallery Image 2 */}
            <div className="col-span-1 row-span-1 brutal-card brutal-cyan p-0 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop" alt="Coding Session" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            {/* Gallery Image 3 */}
            <div className="col-span-1 row-span-2 brutal-card brutal-pink p-0 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop" alt="Team Discussion" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            {/* Gallery Image 4 */}
            <div className="col-span-1 row-span-1 brutal-card brutal-yellow p-0 overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop" alt="Workshop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Intercept Modal ── */}
      {isInterceptModalOpen && upcomingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsInterceptModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-950 tracking-tight mb-2 uppercase">Registration Options</h3>
            <p className="text-slate-500 mb-8 font-medium">
              You are currently not logged in. ACE Members receive exclusive discounts on all operations.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/login" 
                className="w-full brutal-btn brutal-blue py-4 flex justify-center items-center gap-2"
              >
                <span>Login as ACE Member</span>
                <span className="opacity-90 font-mono text-sm">(₹{upcomingEvent.memberFee})</span>
              </Link>
              
              <button 
                onClick={() => {
                  setIsInterceptModalOpen(false);
                  navigate(`/events/checkout/${upcomingEvent._id}?type=guest`);
                }}
                className="w-full border-[3px] border-slate-900 bg-white text-slate-900 py-3.5 rounded-xl hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Continue as Guest</span>
                  <span className="opacity-75 font-mono text-sm">(₹{upcomingEvent.standardFee})</span>
                </div>
                <span className="block text-xs font-bold text-slate-500">Proceed with standard non-member pricing</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuestPortal;

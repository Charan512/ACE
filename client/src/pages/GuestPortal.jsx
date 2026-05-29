import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Terminal, Shield, Zap } from 'lucide-react';
import api from '../lib/api';

const GuestPortal = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-slate-50 min-h-screen pb-24 overflow-hidden">
      
      {/* 1. Asymmetrical & Immersive Hero Section */}
      <section className="relative w-full min-h-[90vh] bg-white flex items-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Massive Typography */}
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[4rem] sm:text-[5rem] lg:text-7xl xl:text-8xl font-heading font-black text-slate-950 tracking-tighter leading-[1.1] mb-6">
              Engineer <br className="hidden lg:block" />
              the <span className="text-primary relative inline-block">Future.
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 -rotate-2"></div>
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-500 tracking-tight leading-relaxed mb-10 max-w-lg">
              SRKR's premier association for artificial intelligence, advanced computing, and high-stakes hackathons.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="bg-slate-950 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary transition-colors shadow-xl hover:-translate-y-1">
                Join the Club
              </Link>
              <a href="#events" className="text-slate-600 font-bold px-6 py-4 hover:text-slate-950 transition-colors underline-offset-4 hover:underline">
                View Arena
              </a>
            </div>
          </div>

          {/* Right Column: Staggered Visual Composition */}
          <div className="relative h-[500px] lg:h-[600px] hidden md:block">
            <div className="absolute top-10 right-0 w-3/4 h-[300px] bg-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 hover:-translate-y-2 transition-transform duration-500 z-10">
              <img src="https://placehold.co/800x600/e2e8f0/475569?text=Hackathon+Live" alt="Hackathon" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-10 left-10 w-2/3 h-[250px] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 hover:-translate-y-2 transition-transform duration-500 z-20">
              <img src="https://placehold.co/800x600/1e293b/94a3b8?text=Code+Review" alt="Code Review" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
            </div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center -rotate-6 z-30 font-black text-2xl tracking-tighter border-4 border-white">
              ACE
            </div>
          </div>

        </div>

        {/* Absolute Bottom Marquee */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden bg-slate-950 py-3 flex border-t border-slate-800">
          <div className="animate-marquee whitespace-nowrap text-slate-400 font-mono text-sm tracking-wider uppercase font-bold flex gap-8">
            <span>• Artificial Intelligence</span>
            <span>• Web3 & Blockchain</span>
            <span>• Distributed Systems</span>
            <span>• Cloud Architecture</span>
            <span>• Competitive Programming</span>
            <span>• Open Source</span>
            {/* Duplicates for seamless loop */}
            <span>• Artificial Intelligence</span>
            <span>• Web3 & Blockchain</span>
            <span>• Distributed Systems</span>
            <span>• Cloud Architecture</span>
            <span>• Competitive Programming</span>
            <span>• Open Source</span>
          </div>
        </div>
      </section>

      {/* 2. The Bento Box Grid (About Section) */}
      <section id="about" className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter mb-12">System Overview.</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 lg:gap-6 h-auto md:h-[600px]">
          
          {/* Feature Card: Large (Spans 2 cols, 2 rows) */}
          <div className="md:col-span-2 md:row-span-2 bg-slate-950 rounded-[2rem] p-10 relative overflow-hidden group hover:-translate-y-1 hover:ring-2 hover:ring-primary/50 transition-all shadow-xl">
            <Cpu className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-800 opacity-50 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-3xl font-heading font-black text-white mb-4 relative z-10 tracking-tight">Deep Tech Workshops</h3>
            <p className="text-slate-400 text-lg leading-relaxed relative z-10 max-w-md">
              From building neural networks from scratch to architecting scalable cloud infrastructure. We don't do tutorials; we engineer production-ready systems.
            </p>
          </div>

          {/* Utility Card 1 */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-[2rem] p-8 border border-slate-200 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all">
            <Terminal className="absolute -top-6 -right-6 w-32 h-32 text-slate-100 group-hover:scale-110 transition-transform duration-500" />
            <h4 className="text-xl font-bold text-slate-950 mb-2 relative z-10 tracking-tight">Hackathons</h4>
            <p className="text-slate-500 relative z-10 text-sm font-medium">Flagship 24-hour sprints like Prajwalan.</p>
          </div>

          {/* Utility Card 2 */}
          <div className="md:col-span-1 md:row-span-1 bg-primary text-white rounded-[2rem] p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all shadow-md">
            <Zap className="absolute -top-6 -right-6 w-32 h-32 text-blue-500 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="text-4xl font-black mb-1 relative z-10 tracking-tighter">500+</div>
            <p className="text-blue-100 relative z-10 text-sm font-bold uppercase tracking-wider">Active Members</p>
          </div>

          {/* Utility Card 3 (Spans 2 cols on bottom) */}
          <div className="md:col-span-2 md:row-span-1 bg-slate-100 rounded-[2rem] p-8 border border-slate-200 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-end">
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 text-white group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h4 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Verified Credentials</h4>
              <p className="text-slate-500 font-medium max-w-sm">
                Every event attended is securely logged in your encrypted Digital Vault.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. The Event Arena (Editorial Cards) */}
      <section id="events" className="py-24 bg-white border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter">The Arena.</h2>
              <p className="mt-4 text-slate-500 text-lg font-medium max-w-xl">Active operations and technical challenges.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {loading ? (
              <div className="col-span-full h-40 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full bg-slate-50 rounded-[2rem] text-center py-24 border border-dashed border-slate-300">
                <p className="text-2xl text-slate-950 font-black tracking-tighter">No Active Operations</p>
                <p className="mt-2 text-slate-500 font-medium">The grid is currently quiet.</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="relative group bg-slate-950 rounded-3xl overflow-hidden shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col h-[500px]">
                  
                  {/* Editorial Image (Top 60%) */}
                  <div className="relative h-[60%] w-full overflow-hidden bg-slate-800">
                    <img 
                      src="https://placehold.co/600x600/1e293b/475569?text=Event" 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity opacity-80" 
                    />
                    
                    {/* Overlapping Badge Pill */}
                    <div className="absolute -bottom-5 right-6 bg-primary text-white px-5 py-2.5 rounded-full font-black text-lg shadow-xl shadow-primary/30 z-10 border-4 border-slate-950 flex flex-col items-center leading-none">
                      <span className="text-[0.6rem] uppercase tracking-widest text-blue-200 mb-0.5">ACE Member</span>
                      ₹{(event.memberFee / 100).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* High Contrast Content Block (Bottom 40%) */}
                  <div className="relative flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight line-clamp-1">{event.title}</h3>
                      <p className="text-slate-400 text-sm font-medium mt-2 line-clamp-2">{event.description}</p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <div className="font-mono text-sm text-slate-500">
                        <span className="block mb-1">{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span>{event.venue || 'TBA'}</span>
                      </div>
                      
                      <div className="text-right">
                        <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Standard</span>
                        <span className="text-slate-400 line-through font-mono font-medium text-sm">₹{(event.nonMemberFee / 100).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default GuestPortal;

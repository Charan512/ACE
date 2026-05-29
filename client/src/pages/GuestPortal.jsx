import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { Wrench, Trophy, Users, MapPin, Calendar } from 'lucide-react';
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

  const handleRegister = (eventId) => {
    alert(`Checkout flow for event: ${eventId} will open here.`);
  };

  return (
    <div className="bg-background pt-24 pb-16">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-border-light py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-heading font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-6">
            Empowering Engineering <br className="hidden sm:block" />
            <span className="text-primary">Innovators at SRKR</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 leading-relaxed">
            The Association of Computer Engineers is SRKR's premier technical club. Join us to dive deep into AI, Machine Learning, and core engineering principles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="btn-primary w-full sm:w-auto text-lg px-8 flex items-center justify-center">Join the Club</Link>
            <a href="#events" className="btn-outline w-full sm:w-auto text-lg px-8">Explore Events</a>
          </div>
        </div>
      </section>

      {/* 2. Impact Metrics Banner */}
      <section className="bg-primary py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="py-4 md:py-0">
              <div className="text-4xl font-extrabold text-white mb-2">500+</div>
              <div className="text-indigo-100 font-medium tracking-wide uppercase text-sm">Active Members</div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-4xl font-extrabold text-white mb-2">15+</div>
              <div className="text-indigo-100 font-medium tracking-wide uppercase text-sm">Annual Hackathons</div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-4xl font-extrabold text-white mb-2">50+</div>
              <div className="text-indigo-100 font-medium tracking-wide uppercase text-sm">Technical Workshops</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About ACE (The Mission) */}
      <section id="about" className="py-24 bg-surface-alt">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl">Our Core Pillars</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Building a robust ecosystem for students to learn, build, and scale their ideas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hands-on Workshops</h3>
              <p className="text-slate-600 leading-relaxed">Practical, project-based learning sessions focused on modern tech stacks and emerging AI technologies.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Competitive Hackathons</h3>
              <p className="text-slate-600 leading-relaxed">Host of flagship events like Prajwalan. 24-hour sprints to build solutions for real-world engineering problems.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Peer Networking</h3>
              <p className="text-slate-600 leading-relaxed">Connect with alumni, industry experts, and like-minded peers to accelerate your professional growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Event Arena */}
      <section id="events" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl">Upcoming Events</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Register now. ACE Members receive exclusive discounts.</p>
          </div>
          
          <div className="grid max-w-2xl grid-cols-1 gap-8 mx-auto lg:max-w-none lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full bg-slate-50 rounded-2xl text-center py-16 border border-dashed border-slate-300">
                <p className="text-xl text-slate-900 font-bold">No Upcoming Events Right Now</p>
                <p className="mt-2 text-slate-500">Check back soon for our next major hackathon or workshop.</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="card-modern flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> {event.venue || 'TBA'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 font-mono flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {new Date(event.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-500 font-medium">Guest Pass</span>
                      <span className="text-slate-500 line-through font-mono">₹{(event.nonMemberFee / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg mb-4 border border-blue-100">
                      <span className="text-sm font-bold text-primary">ACE Member Pass</span>
                      <span className="text-lg font-bold text-primary font-mono">₹{(event.memberFee / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <button onClick={() => handleRegister(event._id)} className="btn-primary w-full shadow-none">
                      Secure Ticket
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. CSE Department Integration & Faculty */}
      <section id="department" className="py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-6">Powered by the Dept. of CSE</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                SRKR ACE operates in direct synergy with the Computer Science & Engineering department, 
                bridging the gap between academic curriculum and cutting-edge industry practices.
              </p>
              <a href="https://srkrec.edu.in" target="_blank" rel="noreferrer" className="text-primary hover:text-white font-semibold flex items-center gap-2 transition-colors">
                Visit Department Website <span>→</span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Faculty Cards */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 overflow-hidden">
                  <img src="https://placehold.co/150x150/1e293b/94a3b8?text=HOD" alt="HOD" className="w-full h-full object-cover opacity-80" />
                </div>
                <h4 className="font-bold text-lg">Dr. V. Chandrasekhar</h4>
                <p className="text-sm text-primary font-medium mt-1">Head of Department</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 overflow-hidden">
                  <img src="https://placehold.co/150x150/1e293b/94a3b8?text=Coord" alt="Coordinator" className="w-full h-full object-cover opacity-80" />
                </div>
                <h4 className="font-bold text-lg">Dr. K. N. S. R. P. Reddy</h4>
                <p className="text-sm text-primary font-medium mt-1">Faculty Coordinator</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Past Highlights Gallery */}
      <section id="gallery" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl">Past Highlights</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Moments from our flagship hackathons and workshops.</p>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            <img src="https://placehold.co/600x800/e2e8f0/475569?text=Event+1" alt="Event 1" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://placehold.co/600x400/e2e8f0/475569?text=Event+2" alt="Event 2" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://placehold.co/600x500/e2e8f0/475569?text=Event+3" alt="Event 3" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://placehold.co/600x700/e2e8f0/475569?text=Event+4" alt="Event 4" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://placehold.co/600x450/e2e8f0/475569?text=Event+5" alt="Event 5" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            <img src="https://placehold.co/600x600/e2e8f0/475569?text=Event+6" alt="Event 6" className="w-full rounded-2xl object-cover hover:opacity-90 transition-opacity cursor-pointer" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default GuestPortal;

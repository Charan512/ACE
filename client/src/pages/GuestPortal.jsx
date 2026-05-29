import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import { Terminal } from 'lucide-react';
// import api from '../lib/api';

const GuestPortal = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stub fetch - In Phase 7 we will integrate `api.get('/events')`
    // Mocking an event for now
    const mockEvents = [
      {
        _id: '1',
        title: 'CyberSec 2026 Hackathon',
        description: 'A 24-hour intensive CTF and building session. Break the mainframe, patch the leaks.',
        eventDate: '2026-06-15T09:00:00.000Z',
        location: 'Main Auditorium',
        tags: ['Security', 'CTF'],
        isRegistrationOpen: true,
        memberFee: 15000, // Rs 150
        nonMemberFee: 30000, // Rs 300
      },
      {
        _id: '2',
        title: 'AI Architect Summit',
        description: 'Deep dive into LLM deployment and vector database architecture patterns for modern apps.',
        eventDate: '2026-07-20T10:00:00.000Z',
        location: 'Virtual Terminal',
        tags: ['AI', 'Architecture'],
        isRegistrationOpen: true,
        memberFee: 10000,
        nonMemberFee: 25000,
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  }, []);

  const handleRegister = (eventId) => {
    // In Phase 7: Redirect to checkout or trigger Razorpay flow directly
    console.log(`Initiate guest registration for event ${eventId}`);
    alert(`Checkout flow for event: ${eventId} will open here.`);
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="border-b border-border-sharp bg-slate-950 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-cyber-cyan px-3 py-1 bg-cyber-cyan/10">
              <Terminal className="h-4 w-4 text-cyber-cyan" />
              <span className="font-data text-xs font-bold text-cyber-cyan tracking-wider">
                SYSTEM.READY
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Construct the Future. <br/> 
              <span className="text-text-muted">Byte by Byte.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-text-muted">
              The Association of Computer Engineers is the premier technical collective. 
              Join our hackathons, deep-dives, and architect sessions.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <a href="#events" className="btn-primary">
                VIEW EVENTS
              </a>
              <a href="/login" className="text-sm font-semibold leading-6 text-cyber-cyan hover:text-cyber-cyan-hover flex gap-2 items-center">
                MEMBER LOGIN <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section id="events" className="bg-obsidian py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Active Operations</h2>
            <p className="mt-2 text-lg leading-8 text-text-muted">
              Secure your terminal access before capacity is reached.
            </p>
          </div>
          
          <div className="mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {loading ? (
              <p className="text-text-disabled font-data">Loading network resources...</p>
            ) : events.length === 0 ? (
              <p className="text-text-disabled font-data">No active operations found.</p>
            ) : (
              events.map((event) => (
                <EventCard 
                  key={event._id} 
                  event={event} 
                  onRegister={handleRegister} 
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuestPortal;

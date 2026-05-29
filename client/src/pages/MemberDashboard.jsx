import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import DigitalIdCard from '../components/DigitalIdCard';
import EventCard from '../components/EventCard';
import { Download, ShieldCheck } from 'lucide-react';
import api from '../lib/api';

const MemberDashboard = () => {
  const { user } = useAuthStore();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vaultEvents, setVaultEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch active events
        const eventsResponse = await api.get('/events');
        setUpcomingEvents(eventsResponse.data.data || []);

        // Fetch user's vault (past attended events)
        const vaultResponse = await api.get('/users/me/vault');
        setVaultEvents(vaultResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setUpcomingEvents([]);
        setVaultEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleRegister = (eventId) => {
    // Razorpay flow for member registration
    console.log(`Initiate member registration for event ${eventId}`);
    alert(`Checkout flow (Member Rate) for event: ${eventId}`);
  };

  const handleDownloadCert = (eventId) => {
    // Trigger download from backend
    alert(`Downloading high-res zero-storage certificate for event: ${eventId}`);
  };

  return (
    <div className="pt-20 pb-24 min-h-screen bg-obsidian">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header & ID Card */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-cyber-cyan" />
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              MEMBER PASSPORT
            </h1>
          </div>
          <DigitalIdCard user={user || { name: 'JOHN DOE', aceId: '26ACE0001', role: 'member', email: 'john@ace.org' }} />
        </section>

        {/* The Event Arena */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-6 border-b border-border-sharp pb-2">
            THE ARENA (ACTIVE EVENTS)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-full card-sharp text-center py-12 border-dashed border-border-sharp">
                <p className="text-lg text-text-primary font-bold tracking-wider">NO UPCOMING EVENTS SCHEDULED RIGHT NOW</p>
                <p className="mt-2 text-text-muted font-data text-sm">CHECK BACK SOON FOR UPDATES.</p>
              </div>
            ) : (
              upcomingEvents.map(ev => (
                <EventCard key={ev._id} event={ev} onRegister={handleRegister} />
              ))
            )}
          </div>
        </section>

        {/* The Vault */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-6 border-b border-border-sharp pb-2">
            THE VAULT (HISTORY)
          </h2>
          {loading ? (
            <div className="flex h-40 items-center justify-center w-full">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-cyan border-t-transparent"></div>
            </div>
          ) : vaultEvents.length === 0 ? (
            <div className="card-sharp text-center py-12 border-dashed border-border-sharp w-full">
              <p className="text-lg text-text-primary font-bold tracking-wider">VAULT IS EMPTY</p>
              <p className="mt-2 text-text-muted font-data text-sm">ATTEND EVENTS TO UNLOCK SECURE CERTIFICATES.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vaultEvents.map(ev => (
                <div key={ev._id} className="card-sharp flex flex-col justify-between h-40 group hover:border-cyber-cyan transition-colors">
                  <div>
                    <h3 className="font-bold text-text-primary truncate" title={ev.title}>{ev.title}</h3>
                    <p className="font-data text-xs text-text-muted mt-2">
                      {new Date(ev.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDownloadCert(ev._id)}
                    className="flex items-center justify-between text-sm font-bold text-cyber-cyan opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <span>DOWNLOAD CERT</span>
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default MemberDashboard;

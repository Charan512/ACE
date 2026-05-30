import { useState, useEffect, useCallback } from 'react';
import { Shield, Command, LayoutTemplate, LogOut, Loader2, CheckCircle2, AlertTriangle, Users, Landmark, Wrench, Edit3, UserCheck, ShieldAlert, Award } from 'lucide-react';
import CommandPalette from '../components/CommandPalette';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

// ─────────────────────────────────────────────────────────────
// TOAST — lightweight notification box
// ─────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full p-4 rounded-xl shadow-2xl border transition-all
        ${isSuccess
          ? 'bg-slate-900 border-green-500/40 text-green-400'
          : 'bg-slate-900 border-red-500/40 text-red-400'
        }`}
    >
      {isSuccess
        ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      }
      <p className="text-sm font-medium leading-snug text-white">{toast.message}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState({ totalMembers: 0, totalRevenue: 0, activeJobs: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Events & Canvas Studio State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [templateUrl, setTemplateUrl] = useState('https://via.placeholder.com/800x600.png?text=Base+Template+from+R2');
  const [xPercent, setXPercent] = useState(50);
  const [yPercent, setYPercent] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  // User Directory State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch Stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch Events ──────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const response = await api.get('/events');
      const eventList = response.data.data || [];
      setEvents(eventList);
      
      if (eventList.length > 0) {
        const firstEvent = eventList[0];
        setSelectedEventId(firstEvent._id);
        if (firstEvent.certificateTemplate) {
          setTemplateUrl(firstEvent.certificateTemplate.baseImageUrl || '');
          const nameField = firstEvent.certificateTemplate.textFields?.find(f => f.label === 'recipientName');
          if (nameField) {
            setXPercent(nameField.xPercent);
            setYPercent(nameField.yPercent);
          }
        }
      }
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch events:', err.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // ── Fetch Users ───────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('[AdminDashboard] Failed to fetch users:', err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // On Load
  useEffect(() => {
    fetchStats();
    fetchEvents();
    fetchUsers();
  }, [fetchStats, fetchEvents, fetchUsers]);

  // Cmd+K Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Handle Event Selection ───────────────────────────────
  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e._id === eventId);
    if (event) {
      if (event.certificateTemplate) {
        setTemplateUrl(event.certificateTemplate.baseImageUrl || '');
        const nameField = event.certificateTemplate.textFields?.find(f => f.label === 'recipientName');
        if (nameField) {
          setXPercent(nameField.xPercent);
          setYPercent(nameField.yPercent);
        }
      } else {
        setTemplateUrl('https://via.placeholder.com/800x600.png?text=Base+Template+from+R2');
        setXPercent(50);
        setYPercent(50);
      }
    }
  };

  // ── Save Certificate Layout ──────────────────────────────
  const handleSaveConfig = async () => {
    if (!selectedEventId) {
      showToast('No event selected.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const config = {
        baseImageUrl: templateUrl,
        textFields: [
          {
            label: 'recipientName',
            xPercent: Number(xPercent),
            yPercent: Number(yPercent),
            fontSizePercent: 2.5,
            fontFamily: 'JetBrains Mono',
            color: '#000000',
            textAlign: 'center',
            fontWeight: 'bold'
          }
        ]
      };

      const response = await api.patch(`/events/${selectedEventId}`, {
        certificateTemplate: config
      });

      // Update events in state list
      setEvents(prev => prev.map(e => e._id === selectedEventId ? response.data.data : e));
      showToast('Certificate configuration saved successfully.', 'success');
    } catch (err) {
      console.error('[CanvasStudio] Save error:', err.message);
      showToast(err.response?.data?.message || 'Failed to save certificate layout.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Promote / Change User Role ────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully.', 'success');
      
      // Update local state list
      setUsers(prev => prev.map(u => 
        u._id === userId 
          ? { ...u, role: newRole === 'ebm' || newRole === 'sbm' ? 'body_member' : newRole } 
          : u
      ));
    } catch (err) {
      console.error('[UserTable] Role update error:', err.message);
      showToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toast toast={toast} />

      {/* Modern Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-heading font-black tracking-tight text-slate-900">
            ACE Admin Control
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 font-medium text-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 shadow-inner">
            <Command className="h-4 w-4" />
            <span>Cmd + K to Search</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 font-bold transition-colors bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-full px-4 py-2 shadow-sm cursor-pointer">
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Stat Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Members */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Members</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-2" />
            ) : (
              <p className="text-4xl font-heading font-black text-slate-900 relative z-10 font-data">{stats.totalMembers.toLocaleString()}</p>
            )}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl z-0"></div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Revenue (INR)</p>
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-2" />
            ) : (
              <p className="text-4xl font-heading font-black text-slate-900 relative z-10 font-data">
                ₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl z-0"></div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Active Jobs</p>
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-2" />
            ) : (
              <p className="text-4xl font-heading font-black text-slate-900 relative z-10 font-data">{stats.activeJobs}</p>
            )}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl z-0"></div>
          </div>
        </section>

        {/* Canvas Studio */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-sm">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-heading font-black tracking-tight text-slate-900">Canvas Studio</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Controls */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-6 lg:col-span-1">
              
              {/* Event Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Event</label>
                {eventsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Fetching active events...</span>
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-red-500 font-bold">No events available.</p>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium appearance-none cursor-pointer"
                      value={selectedEventId}
                      onChange={(e) => handleEventChange(e.target.value)}
                    >
                      {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Base R2 Template URL</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium" 
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-4">
                  Name X Position
                  <span className="text-primary bg-blue-50 px-3 py-1 rounded-full font-mono">{xPercent}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={xPercent}
                  onChange={(e) => setXPercent(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-4">
                  Name Y Position
                  <span className="text-primary bg-blue-50 px-3 py-1 rounded-full font-mono">{yPercent}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={yPercent}
                  onChange={(e) => setYPercent(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <button 
                onClick={handleSaveConfig}
                disabled={isSaving || !selectedEventId}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" /> Save Configuration
                  </>
                )}
              </button>
            </div>

            {/* Right side: Preview */}
            <div className="bg-slate-100 rounded-[2rem] shadow-inner border border-slate-200 lg:col-span-2 relative overflow-hidden flex items-center justify-center p-8 min-h-[400px]">
              <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white">
                <img src={templateUrl} alt="Template" className="max-w-full h-auto object-contain bg-white" />
                
                {/* Overlay Marker */}
                <div 
                  className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    &#123;recipientName&#125;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Directory */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-heading font-black tracking-tight text-slate-900">User Directory</h2>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-bold text-slate-500">Retrieving user roster...</span>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center py-10 text-slate-400">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sequential ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class / Branch</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          {user.aceId ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary border border-blue-100 font-mono tracking-wider">
                              <Award className="w-3 h-3" /> {user.aceId}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Member ID</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                            ${user.role === 'admin' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : user.role === 'body_member' 
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : user.role === 'member'
                              ? 'bg-green-50 text-green-600 border-green-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {user.role === 'body_member' ? 'Body Member' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {user.branch ? (
                            <div>
                              <span className="font-bold text-slate-700">{user.branch}</span>
                              {user.year && <span className="text-xs text-slate-400"> (Year {user.year})</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block w-48">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                              <option value="guest">Guest</option>
                              <option value="member">Member</option>
                              <option value="ebm">Body Member (EBM)</option>
                              <option value="sbm">Body Member (SBM)</option>
                              <option value="admin">Admin</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;

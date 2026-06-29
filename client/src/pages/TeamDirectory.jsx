import { useState, useEffect } from 'react';
import { Linkedin, Mail, User, Loader2 } from 'lucide-react';
import api from '../lib/api';

const TeamDirectory = () => {
  const [activeTab, setActiveTab] = useState('EBM');
  const [ebms, setEbms] = useState([]);
  const [sbms, setSbms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Playful clay colors array to pick from based on index
  const clayColors = ['clay-blue', 'clay-pink', 'clay-lime', 'clay-purple', 'clay-yellow'];

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/users/team');
        const team = res.data.data.team;

        // Separate fetched team
        const fetchedEbms = team.filter(member => member.role === 'ebm');
        const fetchedSbms = team.filter(member => member.role === 'sbm');

        // Pad to 25 items each
        const paddedEbms = Array.from({ length: 25 }).map((_, i) => {
          if (fetchedEbms[i]) return fetchedEbms[i];
          return {
            _id: `placeholder-ebm-${i}`,
            name: `EBM ${i + 1}`,
            role: 'Executive Body Member',
            branch: 'TBD',
            profilePhoto: null,
            linkedin: '',
            email: ''
          };
        });

        const paddedSbms = Array.from({ length: 25 }).map((_, i) => {
          if (fetchedSbms[i]) return fetchedSbms[i];
          return {
            _id: `placeholder-sbm-${i}`,
            name: `SBM ${i + 1}`,
            role: 'Senior Body Member',
            branch: 'TBD',
            profilePhoto: null,
            linkedin: '',
            email: ''
          };
        });

        setEbms(paddedEbms);
        setSbms(paddedSbms);
      } catch (err) {
        console.error('Failed to fetch team members', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const displayData = activeTab === 'EBM' ? ebms : sbms;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter text-slate-900 mb-4">
            Meet the Team
          </h1>
          <p className="text-lg font-medium text-slate-500 max-w-2xl mx-auto">
            The dedicated student leaders driving innovation, managing operations, and architecting the future of ACE.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center mb-12">
          <div className="clay-card clay-slate p-2 inline-flex gap-2">
            <button
              onClick={() => setActiveTab('EBM')}
              className={`px-8 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'EBM' 
                  ? 'clay-btn clay-btn-indigo text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Executive Body
            </button>
            <button
              onClick={() => setActiveTab('SBM')}
              className={`px-8 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'SBM' 
                  ? 'clay-btn clay-btn-indigo text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Senior Body
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="font-bold font-mono text-slate-500 tracking-widest uppercase text-sm">Loading Roster...</p>
          </div>
        ) : (
          /* Directory Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {displayData.map((member, i) => {
              const clayColor = clayColors[i % clayColors.length];
              return (
                <div key={member._id} className={`group clay-card ${clayColor} overflow-hidden p-3 flex flex-col items-center hover:-translate-y-2 transition-all duration-300 cursor-default`}>
                  
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-2xl bg-white overflow-hidden shadow-inner flex items-center justify-center mb-4">
                    {member.profilePhoto ? (
                      <img src={member.profilePhoto} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-slate-300" />
                    )}

                    {/* Hover Reveal Overlay */}
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="clay-btn clay-btn-white w-10 h-10 p-0 flex items-center justify-center text-indigo-600 hover:text-indigo-700">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      <a href={`mailto:${member.email || '#'}`} className="clay-btn clay-btn-white w-10 h-10 p-0 flex items-center justify-center text-slate-700 hover:text-slate-900">
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-center w-full px-2 pb-2">
                    <h3 className="font-heading font-black text-lg text-slate-900 truncate leading-tight">
                      {member.name}
                    </h3>
                    <p className="text-xs font-bold text-indigo-600/80 mt-1 uppercase tracking-wider truncate">
                      {member.designation || member.role}
                    </p>
                    <div className="mt-3 bg-white/60 backdrop-blur-sm px-2.5 py-1 rounded-lg inline-block shadow-sm border border-white/50 text-[10px] font-mono font-bold text-slate-600">
                      {member.branch}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeamDirectory;

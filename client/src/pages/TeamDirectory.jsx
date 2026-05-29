import { useState, useEffect } from 'react';
import { Link as LinkIcon, Camera, Mail, User } from 'lucide-react';

const TeamDirectory = () => {
  const [activeTab, setActiveTab] = useState('EBM');

  // Generate EBM Data (25 members)
  const ebmData = Array.from({ length: 25 }).map((_, index) => {
    if (index === 0) {
      return {
        id: `ebm-${index}`,
        name: "Nalla Sri Ram Charan",
        role: "Executive Body Member",
        branch: "AIML",
        image: null,
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
        email: "charan@srkr.edu.in"
      };
    }
    return {
      id: `ebm-${index}`,
      name: `EBM ${index + 1}`,
      role: "Executive Body Member",
      branch: "CSE",
      image: null,
      linkedin: "#",
      instagram: "#",
      email: "#"
    };
  });

  // Generate SBM Data (24 members)
  const sbmData = Array.from({ length: 24 }).map((_, index) => ({
    id: `sbm-${index}`,
    name: `SBM ${index + 1}`,
    role: "Senior Body Member",
    branch: "IT",
    image: null,
    linkedin: "",
    instagram: "",
    email: ""
  }));

  const displayData = activeTab === 'EBM' ? ebmData : sbmData;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Meet the Team
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The dedicated student leaders driving innovation, managing operations, and architecting the future of ACE.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('EBM')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'EBM' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Body
            </button>
            <button
              onClick={() => setActiveTab('SBM')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'SBM' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Senior Body
            </button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayData.map((member) => (
            <div key={member.id} className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              
              {/* Image Container */}
              <div className="relative aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-20 h-20 text-slate-300" />
                )}

                {/* Hover Reveal Overlay */}
                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                  <a href={member.linkedin || '#'} className="bg-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg text-primary">
                    <LinkIcon className="w-5 h-5" />
                  </a>
                  <a href={member.instagram || '#'} className="bg-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg text-pink-600">
                    <Camera className="w-5 h-5" />
                  </a>
                  <a href={`mailto:${member.email || '#'}`} className="bg-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg text-slate-800">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 text-center bg-white relative z-10">
                <h3 className="font-heading font-bold text-lg text-slate-900 truncate">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-primary mt-1">
                  {member.role}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono bg-slate-50 inline-block px-2 py-1 rounded-md">
                  {member.branch}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TeamDirectory;

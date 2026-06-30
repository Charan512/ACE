import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';

// ── Role accent labels ───────────────────────────────────────
const ROLE_CONFIG = {
  admin:  { label: 'System Admin', gradient: 'from-pink-400 to-rose-400' },
  ebm:    { label: 'Body Member', gradient: 'from-purple-400 to-fuchsia-400' },
  sbm:    { label: 'Body Member', gradient: 'from-cyan-400 to-blue-400' },
  member: { label: 'Member', gradient: 'from-indigo-400 to-purple-400' },
};

const BRANCH_SHORT = {
  'CSE': 'CS',  'ECE': 'EC',  'EEE': 'EE',  'MECH': 'ME',
  'CIVIL': 'CV', 'IT': 'IT',  'MBA': 'MBA', 'MCA': 'MCA',
};

// ─────────────────────────────────────────────────────────────
// DIGITAL ID CARD
// Glassmorphism design: heavily blurred background, semi-transparent panels, 3D tilt
// ─────────────────────────────────────────────────────────────
const DigitalIdCard = ({ user }) => {
  if (!user) return null;

  const cfg    = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
  const branch = BRANCH_SHORT[user.branch] || user.branch || '—';
  const year   = user.year ? `Year ${user.year}` : null;
  
  // 3D Tilt Effect State
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      className="w-full relative z-10"
    >
      <div 
        className="glass-card p-0 overflow-hidden rounded-3xl w-full"
        style={{
          transform: isHovering ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)` : 'rotateX(0) rotateY(0) scale3d(1, 1, 1)',
          transition: isHovering ? 'none' : 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
        }}
      >
        <div className="flex flex-col sm:flex-row relative z-10">

          {/* Left: QR Code Block */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/20 border-b sm:border-b-0 sm:border-r border-white/40 sm:shrink-0 backdrop-blur-md">
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <QRCodeSVG
                value={user.aceId || user.email}
                size={120}
                bgColor="#ffffff"
                fgColor={`#4f46e5`} // Indigo-600
                level="H"
              />
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-5 bg-white/50 px-3 py-1 rounded-full">
              Scan to verify
            </p>
          </div>

          {/* Right: Details Block */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 relative">
            
            {/* Subtle decorative glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cfg.gradient} rounded-full blur-[60px] opacity-40 pointer-events-none`} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> ACE
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none">
                  {user.name}
                </h2>
              </div>
              <div className="glass-badge px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
                <ShieldCheck className={`w-4 h-4 text-indigo-600`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 pt-6 border-t border-white/40 relative z-10">
              {/* Member ID */}
              {user.aceId && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                    Member ID
                  </p>
                  <p className="font-black text-lg text-slate-900">
                    {user.aceId}
                  </p>
                </div>
              )}

              {/* Branch */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-slate-700" /> Branch
                </p>
                <p className="font-black text-lg text-slate-900">
                  {branch}
                </p>
              </div>

              {/* Year */}
              {year && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-slate-700" /> Year
                  </p>
                  <p className="font-black text-lg text-slate-900">
                    {year}
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="col-span-2 sm:col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                  Email
                </p>
                <p className="font-bold text-sm text-slate-900 truncate bg-white/50 border border-white/50 shadow-sm px-3 py-1.5 rounded-xl inline-block max-w-full">
                  {user.email}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalIdCard;

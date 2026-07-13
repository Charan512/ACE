import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

// ── Role accent labels ───────────────────────────────────────
const ROLE_CONFIG = {
  admin:  { label: 'System Admin', gradient: 'from-pink-400 to-rose-400' },
  ebm:    { label: 'Exec. Body Member', gradient: 'from-purple-400 to-fuchsia-400' },
  sbm:    { label: 'Senior Body Member', gradient: 'from-cyan-400 to-blue-400' },
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
  
  return (
    <div className="w-full relative z-10">
      <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 shadow-2xl p-0 overflow-hidden rounded-3xl w-full">
        <div className="flex flex-col sm:flex-row relative z-10">

          {/* Left: QR Code Block */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/5 border-b sm:border-b-0 sm:border-r border-white/10 sm:shrink-0 backdrop-blur-md">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-white/20">
              <QRCodeSVG
                value={user.aceId || user.email}
                size={120}
                bgColor="#ffffff"
                fgColor="#0f172a" // Slate-900 for high contrast on white QR
                level="H"
              />
            </div>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-5 glass-badge bg-indigo-900/20 border border-indigo-500/20 px-3 py-1 rounded-full">
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
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> ACE
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight leading-none">
                  {user.name}
                </h2>
              </div>
              <div className="glass-badge bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
                <ShieldCheck className={`w-4 h-4 text-indigo-400`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 pt-6 border-t border-white/40 relative z-10">
              {/* Member ID */}
              {user.aceId && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">
                    Member ID
                  </p>
                  <p className="font-mono font-bold text-lg text-slate-100">
                    {user.aceId}
                  </p>
                </div>
              )}

              {/* Branch */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" /> Branch
                </p>
                <p className="font-black text-lg text-slate-100">
                  {branch}
                </p>
              </div>

              {/* Year */}
              {year && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-400" /> Year
                  </p>
                  <p className="font-mono font-bold text-lg text-slate-100">
                    {year}
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="col-span-2 sm:col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">
                  Email
                </p>
                <p className="font-mono font-medium text-sm text-slate-200 truncate bg-white/5 border border-white/10 shadow-sm px-3 py-1.5 rounded-xl inline-block max-w-full">
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

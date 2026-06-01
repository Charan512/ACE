import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';

// ── Role accent colours ───────────────────────────────────────
const ROLE_CONFIG = {
  admin:  { color: '#f43f5e', gradient: 'rgba(244,63,94,0.15)',   label: 'System Admin' },
  ebm:    { color: '#c084fc', gradient: 'rgba(192,132,252,0.15)', label: 'Body Member' },
  sbm:    { color: '#818cf8', gradient: 'rgba(129,140,248,0.15)', label: 'Body Member' },
  member: { color: '#34d399', gradient: 'rgba(52,211,153,0.12)',  label: 'Member'      },
};

const BRANCH_SHORT = {
  'CSE': 'CS',  'ECE': 'EC',  'EEE': 'EE',  'MECH': 'ME',
  'CIVIL': 'CV', 'IT': 'IT',  'MBA': 'MBA', 'MCA': 'MCA',
};

// ─────────────────────────────────────────────────────────────
// DIGITAL ID CARD
// 3D mouse-tilt on desktop. Flat on mobile.
// Glass surface with gradient border glow on hover.
// ─────────────────────────────────────────────────────────────
const DigitalIdCard = ({ user }) => {
  const cardRef = useRef(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    setTilt({ x: (y - 0.5) * 12, y: (x - 0.5) * -12 });
  };

  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false); };

  if (!user) return null;

  const cfg    = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
  const branch = BRANCH_SHORT[user.branch] || user.branch || '—';
  const year   = user.year ? `Year ${user.year}` : null;

  return (
    <div style={{ perspective: '1200px' }} className="w-full select-none">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: hovered ? 'transform 0.08s ease-out' : 'transform 0.55s ease-out',
          transformStyle: 'preserve-3d',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '18px',
          overflow: 'hidden',
          position: 'relative',
          // Gradient border via box-shadow on hover
          boxShadow: hovered
            ? `0 0 0 1px rgba(129,140,248,0.4), 0 20px 60px rgba(0,0,0,0.1), 0 4px 24px ${cfg.gradient}`
            : '0 0 0 1px rgba(226,232,240,0.8), 0 8px 32px rgba(0,0,0,0.05)',
        }}
      >
        {/* Top accent strip — gradient bar using role colour */}
        <div
          style={{
            height: '3px',
            background: `linear-gradient(90deg, transparent 0%, ${cfg.color} 40%, ${cfg.color}88 100%)`,
          }}
        />

        {/* Subtle inner glow behind the QR area */}
        <div
          className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${cfg.gradient} 0%, transparent 65%)`,
          }}
        />

        {/* Card body */}
        <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 relative">

          {/* Left: QR Code */}
          <div className="flex flex-col items-center gap-3 sm:shrink-0">
            <div
              style={{
                background: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              <QRCodeSVG
                value={user.aceId || user.email}
                size={100}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
              />
            </div>
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">
              Scan to verify
            </p>
          </div>

          {/* Right: Details */}
          <div className="flex-1 flex flex-col justify-between gap-5 min-w-0">

            {/* Name + role badge */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] mb-1" style={{ color: cfg.color }}>
                  ACE ERP
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {user.name}
                </h2>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
                style={{
                  background: cfg.gradient,
                  border: `1px solid ${cfg.color}40`,
                  color: cfg.color,
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Data fields */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 pt-4"
              style={{ borderTop: '1px solid rgba(226,232,240,1)' }}
            >
              {/* Member ID */}
              {user.aceId && (
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-[0.15em] mb-1" style={{ color: '#475569' }}>
                    Member ID
                  </p>
                  <p className="font-mono text-sm font-bold tracking-widest" style={{ color: cfg.color }}>
                    {user.aceId}
                  </p>
                </div>
              )}

              {/* Branch */}
              <div>
                <p className="text-[8px] font-mono uppercase tracking-[0.15em] mb-1 flex items-center gap-1" style={{ color: '#64748b' }}>
                  <BookOpen className="w-2.5 h-2.5" /> Branch
                </p>
                <p className="font-mono text-sm font-semibold text-slate-700">
                  {branch}
                </p>
              </div>

              {/* Year */}
              {year && (
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-[0.15em] mb-1 flex items-center gap-1" style={{ color: '#64748b' }}>
                    <GraduationCap className="w-2.5 h-2.5" /> Year
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-700">
                    {year}
                  </p>
                </div>
              )}

              {/* Email */}
              <div className="col-span-2 sm:col-span-3">
                <p className="text-[8px] font-mono uppercase tracking-[0.15em] mb-1" style={{ color: '#64748b' }}>
                  Email
                </p>
                <p className="font-mono text-xs text-slate-600 truncate">
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

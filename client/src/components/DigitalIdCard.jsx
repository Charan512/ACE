import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck } from 'lucide-react';

// ── Role accent colours (border/text only — no fills or gradients) ──
const ROLE_COLOR = {
  ebm:    '#c084fc',
  sbm:    '#60a5fa',
  member: '#34d399',
};

const ROLE_LABEL = {
  ebm:    'Body Member',
  sbm:    'Body Member',
  member: 'Member',
};

// ─────────────────────────────────────────────────────────────
// DIGITAL ID CARD
// 3D tilt on desktop (mouse-tracking perspective transform).
// Mobile: flat card, no tilt.
// No gradients, no glare fills, no radial colour overlays.
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
    setTilt({ x: (y - 0.5) * 14, y: (x - 0.5) * -14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  if (!user) return null;

  const accent = ROLE_COLOR[user.role] || '#94a3b8';
  const label  = ROLE_LABEL[user.role] || 'Member';

  return (
    <div style={{ perspective: '1200px' }} className="w-full select-none">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: hovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d',
          background: '#0f172a',
          border: '1px solid rgba(51,65,85,0.6)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top role-coloured rule — 2px line, not a gradient */}
        <div style={{ height: '2px', background: accent, opacity: 0.7 }} />

        {/* Card body */}
        <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">

          {/* Left: QR Code */}
          <div className="flex flex-col items-center gap-3 sm:shrink-0">
            <div
              style={{
                background: '#ffffff',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(51,65,85,0.3)',
              }}
            >
              <QRCodeSVG
                value={user.aceId || 'ACE'}
                size={96}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
              />
            </div>
            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
              {user.aceId || '—'}
            </p>
          </div>

          {/* Right: Details */}
          <div className="flex-1 flex flex-col justify-between gap-4 min-w-0">

            {/* Name + role badge */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
                {user.name}
              </h2>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0"
                style={{
                  border: `1px solid ${accent}40`,
                  color: accent,
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                  {label}
                </span>
              </div>
            </div>

            {/* Data fields */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4"
              style={{ borderTop: '1px solid rgba(51,65,85,0.4)' }}
            >
              <div>
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
                  Member ID
                </p>
                <p className="font-mono text-sm font-semibold text-slate-200 tracking-widest">
                  {user.aceId || '—'}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">
                  Email
                </p>
                <p className="font-mono text-sm text-slate-400 truncate">
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

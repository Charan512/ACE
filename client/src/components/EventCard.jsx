import { Calendar, MapPin, Tag, Loader2, ArrowRight, Lock, CheckCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// EVENT CARD — Glassmorphism design with indigo accent
// ─────────────────────────────────────────────────────────────
const EventCard = ({ event, onRegister, isRegistering = false, isRegistered = false }) => {
  const {
    _id,
    title,
    description,
    eventDate,
    venue,
    tags,
    isRegistrationOpen,
    memberFee,
    standardFee,
  } = event;

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const hasDiscount = memberFee < standardFee;

  return (
    <div
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = '1px solid rgba(129,140,248,0.4)';
        e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.1), 0 4px 24px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(226, 232, 240, 0.8)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.05)';
      }}
    >
      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide"
                style={{
                  color: '#818cf8',
                  background: 'rgba(129,140,248,0.1)',
                  border: '1px solid rgba(129,140,248,0.2)',
                }}
              >
                <Tag className="w-2.5 h-2.5 opacity-70" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          className="text-base font-semibold text-slate-900 leading-snug line-clamp-2 transition-colors duration-150"
          style={{ cursor: 'default' }}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
          {description}
        </p>

        {/* Meta */}
        <div
          className="flex flex-col gap-2 text-xs font-mono text-slate-500 pt-3"
          style={{ borderTop: '1px solid rgba(226,232,240,1)' }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#4f5882' }} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#64748b' }} />
            <span className="truncate">{venue || 'Venue TBA'}</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div
        className="px-5 pb-5 pt-4"
        style={{ borderTop: '1px solid rgba(226,232,240,1)' }}
      >
        {/* Price block */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{memberFee}
            </span>
            {hasDiscount && (
              <span className="text-sm font-mono text-slate-600 line-through">
                ₹{standardFee}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: '#34d399',
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              Member price
            </span>
          )}
        </div>

        {/* CTA Button */}
        <button
          id={`register-btn-${_id}`}
          onClick={() => onRegister(_id)}
          disabled={!isRegistrationOpen || isRegistering || isRegistered}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]"
          style={
            isRegistered
              ? { background: 'rgba(52,211,153,0.1)', color: '#059669', border: '1px solid rgba(52,211,153,0.3)', cursor: 'not-allowed' }
              : !isRegistrationOpen
              ? { background: 'rgba(241,245,249,1)', color: '#64748b', border: '1px solid rgba(226,232,240,1)', cursor: 'not-allowed' }
              : isRegistering
              ? { background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(129,140,248,0.3)', cursor: 'not-allowed' }
              : { background: 'rgba(99,102,241,0.9)', color: '#ffffff', border: '1px solid rgba(99,102,241,1)', cursor: 'pointer' }
          }
          onMouseEnter={e => {
            if (!isRegistrationOpen || isRegistering || isRegistered) return;
            e.currentTarget.style.background = 'rgba(99,102,241,1)';
          }}
          onMouseLeave={e => {
            if (!isRegistrationOpen || isRegistering || isRegistered) return;
            e.currentTarget.style.background = 'rgba(99,102,241,0.85)';
          }}
        >
          {isRegistered ? (
            <><CheckCircle className="w-4 h-4 shrink-0" /> Registered</>
          ) : isRegistering ? (
            <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Processing…</>
          ) : isRegistrationOpen ? (
            <>Register Now <ArrowRight className="w-4 h-4 shrink-0" /></>
          ) : (
            <><Lock className="w-3.5 h-3.5 shrink-0" /> Registration Closed</>
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;

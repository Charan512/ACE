import { Calendar, MapPin, Tag, Loader2, ArrowRight, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// EVENT CARD
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

  const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Only show the strikethrough discount treatment when the member price
  // is actually lower than the standard price.
  const hasDiscount = memberFee < standardFee;

  return (
    <div className="group relative flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors duration-200 hover:border-slate-700">

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 uppercase"
              >
                <Tag className="w-2.5 h-2.5 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/events/${_id}`} className="block">
          <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 hover:text-blue-400 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
          {description}
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-xs font-mono text-slate-500 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate">{venue || 'TBA'}</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div className="px-5 pb-5 pt-0 mt-auto">

        {/* Price block */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2">
            {/* Member price — primary */}
            <span className="text-lg font-bold text-white font-mono">
              ₹{memberFee}
            </span>
            {/* Guest price — struck through, shown only when there's a discount */}
            {hasDiscount && (
              <span className="text-sm font-mono text-slate-500 line-through">
                ₹{standardFee}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Member price
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          id={`register-btn-${_id}`}
          onClick={() => onRegister(_id)}
          disabled={!isRegistrationOpen || isRegistering || isRegistered}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[44px]
            ${isRegistered
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
              : !isRegistrationOpen
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
        >
          {isRegistered ? (
            <>
              <CheckCircle className="w-4 h-4 shrink-0" />
              Already Registered
            </>
          ) : isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Processing…
            </>
          ) : isRegistrationOpen ? (
            <>
              Register
              <ArrowRight className="w-4 h-4 shrink-0" />
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Closed
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;

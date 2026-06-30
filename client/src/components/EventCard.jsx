import { Calendar, MapPin, Tag, Loader2, ArrowRight, Lock, CheckCircle } from 'lucide-react';

const getYearExclusivityLabel = (allowedYears) => {
  if (!allowedYears || allowedYears.length === 0 || allowedYears.length === 4) return null;
  const ordinalMap = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
  const years = allowedYears.sort().map(y => ordinalMap[y]).join(', ');
  return `Exclusive to ${years} Year`;
};

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
    <div className="group glass-card flex flex-col h-full overflow-hidden rounded-3xl relative z-10">
      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-4">

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 glass-badge px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-900"
              >
                <Tag className="w-3 h-3 text-indigo-500" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Year Exclusivity Badge */}
        {getYearExclusivityLabel(event.allowedYears) && (
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-900 bg-amber-100/50 border border-amber-200/50 shadow-sm backdrop-blur-md">
            {getYearExclusivityLabel(event.allowedYears)}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm font-medium text-slate-700/80 leading-relaxed line-clamp-3 flex-1">
          {description}
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700 pt-4 border-t border-white/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-500" />
            <span className="truncate">{venue || 'Venue TBA'}</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-5 bg-white/20 border-t border-white/40">
        {/* Price block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{memberFee}
            </span>
            {hasDiscount && (
              <span className="text-sm font-medium text-slate-500 line-through">
                ₹{standardFee}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="glass-badge rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Member price
            </span>
          )}
        </div>

        {/* CTA Button */}
        <button
          id={`register-btn-${_id}`}
          onClick={() => onRegister(_id)}
          disabled={!isRegistrationOpen || isRegistering || isRegistered}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold uppercase tracking-wider min-h-[48px] rounded-2xl ${
            isRegistered
              ? 'glass-panel opacity-80 cursor-not-allowed text-indigo-700'
              : !isRegistrationOpen
              ? 'bg-slate-200/50 text-slate-500 border border-slate-300/50 opacity-60 cursor-not-allowed'
              : isRegistering
              ? 'glass-btn opacity-80 cursor-not-allowed text-slate-700'
              : 'glass-btn text-indigo-900'
          }`}
        >
          {isRegistered ? (
            <><CheckCircle className="w-5 h-5 shrink-0" /> Registered</>
          ) : isRegistering ? (
            <><Loader2 className="w-5 h-5 animate-spin shrink-0" /> Processing…</>
          ) : isRegistrationOpen ? (
            <>Register Now <ArrowRight className="w-5 h-5 shrink-0" /></>
          ) : (
            <><Lock className="w-4 h-4 shrink-0" /> Closed</>
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;

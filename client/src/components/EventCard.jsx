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
    <div className="group bg-[#111214]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(200,117,51,0.05)] flex flex-col h-full overflow-hidden rounded-3xl relative z-10 hover:border-orange-500/30 transition-all duration-300">
      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-4">

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 glass-badge bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-200"
              >
                <Tag className="w-3 h-3 text-orange-400" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Year Exclusivity Badge */}
        {getYearExclusivityLabel(event.allowedYears) && (
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 shadow-sm backdrop-blur-md">
            {getYearExclusivityLabel(event.allowedYears)}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-100 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm font-medium text-slate-300/80 leading-relaxed line-clamp-3 flex-1">
          {description}
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-300 pt-4 border-t border-white/10">
          <div className="flex items-center text-slate-300 text-sm font-bold uppercase tracking-widest">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="font-mono">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span className="truncate">{venue || 'Venue TBA'}</span>
          </div>
        </div>
      </div>

      {/* Pricing + CTA */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-5 bg-white/5 border-t border-white/10">
        {/* Price block */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
              ₹{memberFee}
            </span>
            {hasDiscount && (
              <span className="text-sm font-mono font-medium text-slate-400 line-through">
                ₹{standardFee}
              </span>
            )}
          </div>
          {event.memberFee !== undefined && (
            <span className="glass-badge bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
              Member price
            </span>
          )}
        </div>

        <button
          id={`register-btn-${_id}`}
          onClick={() => onRegister(_id)}
          disabled={!isRegistrationOpen || isRegistering || isRegistered}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold uppercase tracking-wider min-h-[48px] rounded-2xl ${
            isRegistered
              ? 'bg-orange-500/10 border border-orange-500/20 opacity-80 cursor-not-allowed text-orange-300'
              : !isRegistrationOpen
              ? 'bg-white/5 text-slate-400 border border-white/10 opacity-60 cursor-not-allowed'
              : isRegistering
              ? 'glass-btn opacity-80 cursor-not-allowed text-slate-300'
              : 'glass-btn bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30 text-orange-200'
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

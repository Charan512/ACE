import { Calendar, MapPin, Tag, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventCard = ({ event, onRegister, isRegistering = false }) => {
  const { title, description, eventDate, venue, tags, isRegistrationOpen, memberFee, standardFee } = event;

  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="group flex h-full flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.08)] relative">
      
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-600 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Badges row */}
        {tags && tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span key={idx} className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-blue-400 border border-blue-500/20">
                <Tag className="h-3 w-3 opacity-70" />
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        <Link to={`/events/${event._id}`} className="block mb-2 group/link">
          <h3 className="text-xl font-bold leading-tight text-white group-hover/link:text-blue-400 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>
        
        <p className="mb-6 line-clamp-3 text-sm text-slate-400 leading-relaxed flex-1">
          {description}
        </p>

        <div className="space-y-2.5 text-xs font-mono font-medium text-slate-500 mt-auto pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{venue || 'TBA'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 bg-slate-900">
        {/* Pricing Block */}
        <div className="mb-5 flex flex-col gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GUEST_PASS</span>
            <span className="font-mono text-sm font-medium text-slate-300">₹{standardFee}</span>
          </div>
          {/* Member Pricing Highlight */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full" />
              ACE_MEMBER
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400">₹{memberFee}</span>
          </div>
        </div>

        <button 
          onClick={() => onRegister(event._id)}
          disabled={!isRegistrationOpen || isRegistering}
          className={`w-full py-3 px-4 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300
            ${!isRegistrationOpen 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-blue-500/50'
            }`}
        >
          {isRegistering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              PROCESSING_
            </>
          ) : isRegistrationOpen ? (
            <>
              SECURE_TICKET
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            'SYS_CLOSED'
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;

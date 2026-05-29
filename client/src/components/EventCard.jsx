import { Calendar, MapPin, Tag } from 'lucide-react';

const EventCard = ({ event, onRegister }) => {
  const { title, description, eventDate, location, tags, isRegistrationOpen, memberFee, nonMemberFee } = event;

  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="card-sharp flex h-full flex-col justify-between">
      <div>
        {/* Badges row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="flex items-center gap-1 bg-slate-900 px-2 py-1 text-xs font-medium text-cyber-cyan border border-border-sharp">
              <Tag className="h-3 w-3" />
              {tag.toUpperCase()}
            </span>
          ))}
        </div>

        <h3 className="mb-2 text-xl font-bold leading-tight text-text-primary">
          {title}
        </h3>
        
        <p className="mb-6 line-clamp-3 text-sm text-text-muted">
          {description}
        </p>

        <div className="mb-6 space-y-2 text-sm font-medium text-text-disabled">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-data">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border-sharp pt-4">
        {/* Pricing Block */}
        <div className="mb-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted">GUEST PASS</span>
            <span className="font-data text-lg text-text-primary">₹{(nonMemberFee / 100).toLocaleString('en-IN')}</span>
          </div>
          {/* Member Pricing Highlight */}
          <div className="flex items-center justify-between bg-cyber-cyan/10 px-2 py-1 border border-cyber-cyan/30">
            <span className="text-xs font-bold text-cyber-cyan">ACE MEMBER PASS</span>
            <span className="font-data font-bold text-cyber-cyan">₹{(memberFee / 100).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button 
          onClick={() => onRegister(event._id)}
          disabled={!isRegistrationOpen}
          className="btn-primary w-full"
        >
          {isRegistrationOpen ? 'SECURE TICKET' : 'REGISTRATION CLOSED'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;

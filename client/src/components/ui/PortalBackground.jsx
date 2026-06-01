import { Sparkles, Star, Coffee } from 'lucide-react';

const PortalBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden bg-slate-50"
    style={{ zIndex: 0 }}
    aria-hidden="true"
  >
    {/* Decorative Background Icons (Gentle/Friendly Theme) */}
    <div className="absolute top-10 left-10 text-indigo-100/50 -rotate-12 pointer-events-none animate-drift-slow">
      <Sparkles className="w-72 h-72" />
    </div>
    <div className="absolute bottom-0 right-10 text-pink-100/40 rotate-12 pointer-events-none animate-float">
      <Star className="w-96 h-96" />
    </div>
    <div className="absolute top-1/3 right-1/4 text-purple-100/40 rotate-45 pointer-events-none animate-drift-med">
      <Coffee className="w-24 h-24" />
    </div>
  </div>
);

export default PortalBackground;

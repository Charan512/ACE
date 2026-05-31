import { QRCodeSVG } from 'qrcode.react';

const DigitalIdCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="relative group">
      {/* Glow effect behind the card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* The actual Card */}
      <div className="relative flex flex-col md:flex-row items-center gap-8 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Decorative Circuit Board Lines */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="absolute right-4 top-4 opacity-20 pointer-events-none hidden sm:flex gap-1 h-12">
          <div className="w-1 bg-blue-500" />
          <div className="w-2 bg-blue-500 h-1/2 mt-auto" />
          <div className="w-0.5 bg-blue-500" />
        </div>

        {/* QR Code Section */}
        <div className="flex-shrink-0 relative z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] border-2 border-slate-800/50 ring-1 ring-blue-500/20">
            <QRCodeSVG 
              value={user.aceId || 'GUEST_MODULE'} 
              size={120} 
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 space-y-5 relative z-10 w-full text-center md:text-left">
          <div>
            <h2 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-[0.2em] mb-1 opacity-80">
              SYS_PASSPORT // AUTHENTICATED
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {user.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 w-full border-t border-slate-800/60 pt-5">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Terminal_ID</p>
              <p className="font-mono text-base font-medium text-slate-200 tracking-wider">
                {user.aceId}
              </p>
            </div>
            
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clearance_Lvl</p>
              <p className="font-mono text-sm font-bold text-emerald-400 tracking-wider uppercase flex items-center justify-center md:justify-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {user.role}
              </p>
            </div>
            
            <div className="sm:col-span-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">System_Comm_Link</p>
              <p className="font-mono text-sm font-medium text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DigitalIdCard;

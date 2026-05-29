import { QRCodeSVG } from 'qrcode.react';

const DigitalIdCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="card-sharp flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-cyber-cyan">
      {/* QR Code Section */}
      <div className="flex-shrink-0 bg-white p-2 border border-border-sharp">
        <QRCodeSVG 
          value={user.aceId || 'GUEST'} 
          size={120} 
          bgColor="#ffffff"
          fgColor="#000000"
          level="Q"
        />
      </div>

      {/* Details Section */}
      <div className="flex-1 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-cyber-cyan uppercase tracking-widest">
            ACE Member Passport
          </h2>
          <h3 className="text-3xl font-bold text-text-primary uppercase mt-1">
            {user.name}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase">Terminal ID</p>
            <p className="font-data text-lg text-text-primary tracking-widest">
              {user.aceId}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase">Clearance</p>
            <p className="font-data text-lg text-cyber-orange tracking-widest uppercase">
              {user.role}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase">System Email</p>
            <p className="font-data text-sm text-text-primary">
              {user.email}
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative vertical barcode/lines for cyber feel without gradients */}
      <div className="hidden md:flex flex-col gap-1 h-32 justify-center opacity-30">
        <div className="w-1 h-full bg-cyber-cyan"></div>
        <div className="w-0.5 h-3/4 bg-cyber-cyan"></div>
        <div className="w-2 h-full bg-cyber-cyan"></div>
        <div className="w-0.5 h-1/2 bg-cyber-cyan"></div>
        <div className="w-1 h-5/6 bg-cyber-cyan"></div>
      </div>
    </div>
  );
};

export default DigitalIdCard;

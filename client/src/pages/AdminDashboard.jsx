import { useState, useEffect } from 'react';
import { Terminal, Command, LayoutTemplate } from 'lucide-react';
import CommandPalette from '../components/CommandPalette';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  // Canvas Studio State
  const [templateUrl, setTemplateUrl] = useState('https://via.placeholder.com/800x600.png?text=Base+Template+from+R2');
  const [xPercent, setXPercent] = useState(50);
  const [yPercent, setYPercent] = useState(50);

  // Cmd+K Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-text-primary">
      {/* Terminal Header */}
      <header className="border-b border-border-sharp bg-obsidian px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-cyber-cyan" />
          <h1 className="text-xl font-bold font-mono tracking-tight text-cyber-cyan">
            SYS_ADMIN_CONSOLE
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-text-muted font-data text-xs border border-border-sharp px-3 py-1">
            <Command className="h-3 w-3" />
            <span>CMD + K TO SEARCH</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-text-muted hover:text-cyber-orange font-bold">
            TERMINATE SESSION
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stat Overview (Terminal style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-sharp">
            <p className="text-xs text-text-muted font-mono uppercase">Total Members</p>
            <p className="font-data text-3xl text-cyber-cyan mt-2">1,024</p>
          </div>
          <div className="card-sharp">
            <p className="text-xs text-text-muted font-mono uppercase">Revenue (INR)</p>
            <p className="font-data text-3xl text-text-primary mt-2">₹1,50,000</p>
          </div>
          <div className="card-sharp">
            <p className="text-xs text-text-muted font-mono uppercase">Active Jobs</p>
            <p className="font-data text-3xl text-cyber-orange mt-2">3</p>
          </div>
        </section>

        {/* Canvas Studio */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LayoutTemplate className="h-5 w-5 text-cyber-cyan" />
            <h2 className="text-lg font-bold tracking-widest text-text-primary uppercase">Canvas Studio</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Controls */}
            <div className="card-sharp space-y-6 lg:col-span-1">
              <div>
                <label className="block text-xs font-mono text-text-muted uppercase mb-2">Base R2 Template URL</label>
                <input 
                  type="text" 
                  className="input-sharp" 
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted uppercase mb-2">Name X Percent</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={xPercent}
                  onChange={(e) => setXPercent(e.target.value)}
                  className="w-full accent-cyber-cyan"
                />
                <span className="font-data text-xs text-cyber-cyan block mt-1">{xPercent}%</span>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted uppercase mb-2">Name Y Percent</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={yPercent}
                  onChange={(e) => setYPercent(e.target.value)}
                  className="w-full accent-cyber-cyan"
                />
                <span className="font-data text-xs text-cyber-cyan block mt-1">{yPercent}%</span>
              </div>

              <button className="btn-primary w-full">SAVE CONFIGURATION</button>
            </div>

            {/* Right side: Preview */}
            <div className="card-sharp lg:col-span-2 relative overflow-hidden flex items-center justify-center bg-obsidian">
              <img src={templateUrl} alt="Template" className="max-w-full max-h-[500px] opacity-50" />
              
              {/* Overlay Marker */}
              <div 
                className="absolute w-2 h-2 bg-cyber-orange border border-obsidian"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cyber-orange px-2 py-0.5 text-[10px] font-bold text-obsidian font-mono">
                  &#123;name&#125;
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
};

export default AdminDashboard;

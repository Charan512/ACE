import { useState, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mock search logic
  useEffect(() => {
    if (query.length > 2) {
      // Stub search - in Phase 7 we fetch `api.get('/admin/users/search?q=' + query)`
      setResults([
        { _id: '1', name: 'John Doe', aceId: '26ACE0001', email: 'john@ace.org' },
        { _id: '2', name: 'Jane Smith', aceId: '26ACE0002', email: 'jane@ace.org' }
      ].filter(u => 
        u.aceId.toLowerCase().includes(query.toLowerCase()) || 
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.name.toLowerCase().includes(query.toLowerCase())
      ));
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-obsidian/80 backdrop-blur-sm">
      <div className="card-sharp w-full max-w-2xl bg-slate-950 shadow-none border-cyber-cyan/50">
        <div className="flex items-center gap-3 border-b border-border-sharp pb-4">
          <Search className="h-5 w-5 text-cyber-cyan" />
          <input 
            type="text"
            className="flex-1 bg-transparent border-none text-lg text-text-primary focus:outline-none focus:ring-0 placeholder:text-text-disabled font-data"
            placeholder="Search by ID or Email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pt-4 max-h-96 overflow-y-auto">
          {query.length > 2 ? (
            results.length > 0 ? (
              <ul className="space-y-2">
                {results.map(user => (
                  <li key={user._id} className="flex items-center justify-between p-3 hover:bg-slate-900 border border-transparent hover:border-border-sharp cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-text-muted" />
                      <div>
                        <p className="text-sm font-bold text-text-primary">{user.name}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                    </div>
                    <span className="font-data text-cyber-cyan">{user.aceId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-text-muted py-8 font-data">NO RESULTS FOUND.</p>
            )
          ) : (
            <p className="text-center text-text-muted py-8 font-data">TYPE TO INITIATE QUERY.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

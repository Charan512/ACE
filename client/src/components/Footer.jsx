import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border-sharp bg-slate-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center bg-cyber-cyan font-mono text-xs font-bold text-obsidian">
              ACE
            </div>
            <span className="text-sm font-medium text-text-muted">
              Association of Computer Engineers &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm text-text-muted hover:text-text-primary">
              About
            </Link>
            <Link to="/terms" className="text-sm text-text-muted hover:text-text-primary">
              Terms
            </Link>
            <Link to="/privacy" className="text-sm text-text-muted hover:text-text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

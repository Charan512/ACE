import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white/90 backdrop-blur-md shadow-md rounded-full px-6 py-3 flex items-center justify-between w-full max-w-4xl border border-slate-100">
        
        {/* Brand */}
        <Link to="/" className="text-xl font-heading font-bold tracking-tight text-slate-900">
          SRKR <span className="text-primary">ACE</span>
        </Link>

        {/* Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/#about" className="hover:text-primary transition-colors">About</a>
          <a href="/#department" className="hover:text-primary transition-colors">Department</a>
          <a href="/#faculty" className="hover:text-primary transition-colors">Faculty</a>
          <a href="/#gallery" className="hover:text-primary transition-colors">Gallery</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/team" className="btn-primary text-sm py-1.5 px-5">
            Team
          </Link>
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:text-primary-hover hidden sm:block">
            Member Login
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

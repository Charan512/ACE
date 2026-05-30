import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { name: 'About', path: '/#about' },
  { name: 'Department', path: '/#department' },
  { name: 'Faculty', path: '/#faculty' },
  { name: 'Gallery', path: '/#gallery' },
  { name: 'Contact', path: '/#contact' }
];

const Navbar = () => {
  const [hoveredPath, setHoveredPath] = useState(null);
  const location = useLocation();

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav 
        className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl border border-slate-200"
        onMouseLeave={() => setHoveredPath(null)}
      >
        
        {/* Brand */}
        <Link to="/" className="text-xl font-heading font-black tracking-tighter text-slate-950">
          SRKR <span className="text-primary">ACE</span>
        </Link>

        {/* Links (Desktop) - True Magnetic Pill Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.path}
              onMouseEnter={() => setHoveredPath(link.path)}
              className="relative px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors z-10"
            >
              {hoveredPath === link.path && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-slate-100 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {link.name}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/team" className="btn-outline text-sm py-1.5 px-5 shadow-sm hidden sm:block">
            Team
          </Link>
          <Link to="/login" className="btn-primary text-sm py-1.5 px-5 shadow-sm">
            Member Login
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

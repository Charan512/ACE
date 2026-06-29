import { useState, useEffect } from 'react';
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
  const [activePath, setActivePath] = useState('/');
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') {
      setActivePath(location.pathname);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePath(`/#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    const sectionIds = NAV_LINKS.map(link => link.path.replace('/#', ''));
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => {
      if (window.scrollY < 100) setActivePath('/');
    };
    window.addEventListener('scroll', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.pathname]);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav 
        className="clay-card clay-slate px-6 py-3 flex items-center justify-between w-full max-w-5xl"
        onMouseLeave={() => setHoveredPath(null)}
      >
        
        {/* Brand */}
        <Link to="/" className="text-2xl font-black tracking-tighter text-slate-950 flex items-center gap-1">
          SRKR <span className="text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-lg shadow-sm border border-indigo-200">ACE</span>
        </Link>

        {/* Links (Desktop) - True Magnetic Pill Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = hoveredPath === link.path || (hoveredPath === null && activePath === link.path);
            
            return (
              <a
                key={link.name}
                href={link.path}
                onMouseEnter={() => setHoveredPath(link.path)}
                className="relative px-4 py-2 text-sm font-black text-slate-600 hover:text-slate-950 transition-colors z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-yellow-100 border-2 border-yellow-200 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {link.name}
              </a>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/team" className="clay-btn clay-btn-ghost text-sm py-2 px-5 hidden sm:block">
            Team
          </Link>
          <Link to="/login" className="clay-btn clay-btn-blue text-sm py-2 px-5">
            Member Login
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

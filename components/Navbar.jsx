"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaTools, 
  FaSlidersH, 
  FaInfoCircle, 
  FaUser, 
  FaSignOutAlt, 
  FaSignInAlt 
} from 'react-icons/fa';
import { createClient } from '../lib/supabase/client';
import '../app/navbar.scss';

const CommandPalette = dynamic(() => import('./ai-tools/CommandPalette'), {
  ssr: false,
});

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [supabase] = useState(() => createClient());
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleScroll();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'Tools', path: '/tools', icon: <FaTools /> },
    { name: 'AI Tools', path: '/ai-tools', icon: <FaSlidersH /> },
    { name: 'About', path: '/about', icon: <FaInfoCircle /> },
    ...(user
      ? [{ name: 'Profile', path: '/profile', icon: <FaUser />, authVariant: 'profile' }]
      : [{ name: 'Login', path: '/login', icon: <FaSignInAlt />, authVariant: 'login' }]),
  ];

  const isLinkActive = (path) => {
    if (path === '/') return pathname === '/';
    if (path === '/profile') return pathname.startsWith('/profile');
    if (path === '/ai-tools') return pathname.startsWith('/ai-tools');
    if (path === '/tools') return pathname.startsWith('/tools') || pathname.startsWith('/tool/');
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isOpen ? 'nav-open' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          Dev<span>Tools</span>
        </Link>

        <button 
          className="nav-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <CommandPalette />
          {navLinks.map((link) => {
            const active = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`nav-link ${active ? 'active' : ''} ${link.authVariant ? `nav-auth-link ${link.authVariant}` : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-text">{link.name}</span>
              </Link>
            );
          })}

          {user ? (
            <button onClick={handleLogout} className="nav-link nav-auth-btn logout">
              <span className="nav-icon"><FaSignOutAlt /></span>
              <span className="nav-text">Logout</span>
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

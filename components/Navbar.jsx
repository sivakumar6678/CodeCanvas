"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
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
  const [authReady, setAuthReady] = useState(false);
  const [supabase] = useState(() => createClient());
  const pathname = usePathname();
  const router = useRouter();

  const isStudio = pathname.startsWith('/studio');

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

    const getCachedSession = async () => {
      // getSession reads the browser's persisted session and avoids blocking the
      // navigation bar on a round-trip to Supabase.
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthReady(true);
    };
    getCachedSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setAuthReady(true);
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

  if (isStudio) return null;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] navbar-logout:failed', { code: error.code, message: error.message });
      return;
    }
    setUser(null);
    router.replace('/');
    router.refresh();
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'Tools', path: '/tools', icon: <FaTools /> },
    { name: 'AI Tools', path: '/ai-tools', icon: <FaSlidersH /> },
    { name: 'AI Prompts & Tricks', path: '/ai-prompts-tricks', icon: <FaSlidersH /> },
    { name: 'Contribute', path: '/contribute', icon: <FaTools /> },
    { name: 'About', path: '/about', icon: <FaInfoCircle /> },
    ...(authReady && user
      ? [{ name: 'Profile', path: '/profile', icon: <FaUser />, authVariant: 'profile' }]
      : authReady ? [{ name: 'Login', path: '/login', icon: <FaSignInAlt />, authVariant: 'login' }] : []),
  ];

  const isLinkActive = (path) => {
    if (path === '/') return pathname === '/';
    if (path === '/profile') return pathname.startsWith('/profile');
    if (path === '/ai-tools') return pathname.startsWith('/ai-tools');
    if (path === '/ai-prompts-tricks') return pathname.startsWith('/ai-prompts-tricks') || pathname.startsWith('/prompts');
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

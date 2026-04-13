"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes, FaTools, FaHome } from 'react-icons/fa';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import '../app/navbar.scss';

gsap.registerPlugin(ScrollToPlugin);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'Tools', path: '/tools', icon: <FaTools /> }
  ];

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

    // Set active link based on current path
    if (pathname) {
      setActiveLink(pathname);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

  const handleNavClick = (path, e) => {
    if (path === pathname) {
      e.preventDefault();
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: 0, autoKill: false },
        ease: 'power3.inOut'
      });
    }
    setIsOpen(false);
    setActiveLink(path);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isOpen ? 'nav-open' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo" onClick={(e) => handleNavClick('/', e)}>
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
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`nav-link ${activeLink === link.path ? 'active' : ''}`}
              onClick={(e) => handleNavClick(link.path, e)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-text">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



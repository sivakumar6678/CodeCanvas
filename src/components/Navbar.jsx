import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import "../styles/navbar.scss";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    closeMenu();
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/" className="logo">
          Frontend Toolbox
        </Link>

        <button className="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
              onClick={() => scrollToSection('hero')}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={isActive('/about') ? 'active' : ''}
              onClick={() => scrollToSection('about')}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/tools"
              className={isActive('/tools') ? 'active' : ''}
              onClick={() => scrollToSection('tools')}
            >
              Tools
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={isActive('/contact') ? 'active' : ''}
              onClick={() => scrollToSection('contact')}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;



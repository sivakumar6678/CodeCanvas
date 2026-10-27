'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaGithub, FaLinkedin, FaDev, FaMedium, FaGlobe } from 'react-icons/fa';
import BrandLogo from './ui/BrandLogo';
import '../app/footer.scss';

const Footer = () => {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: FaGithub,
      url: 'https://github.com/sivakumar6678',
      color: '#333333'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      url: 'https://www.linkedin.com/in/sivakumar-chandragari/',
      color: '#0077B5'
    },
    {
      name: 'DEV Community',
      icon: FaDev,
      url: 'https://dev.to/sivakumar6678',
      color: '#0A0A0A'
    },
    {
      name: 'Medium',
      icon: FaMedium,
      url: 'https://medium.com/@chandragarisivakumar',
      color: '#000000'
    },
    {
      name: 'Portfolio',
      icon: FaGlobe,
      url: 'https://sivakumar6678.github.io/Portfolio/',
      color: '#6366f1'
    },
  ];

  if (pathname.startsWith('/studio')) return null;

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <section className="footer-brand" aria-label="About CodeCanvas">
            <BrandLogo variant="wide" size="full" href="/" />
          </section>

          <nav className="footer-section" aria-label="Explore CodeCanvas">
            <h4>Explore</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/tools">Tools</Link></li>
              <li><Link href="/ai-tools">AI Tools</Link></li>
              <li><Link href="/ai-knowledge">AI Knowledge</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          </nav>

          <section className="footer-section footer-connect">
            <h4>Connect</h4>
            <p>Follow CodeCanvas on social media.</p>
            <div className="social-links">
              {socialLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  link.url ? (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      style={{ '--icon-color': link.color }}
                      aria-label={link.name}
                    >
                      <IconComponent aria-hidden="true" />
                      <span className="social-link-label">{link.name}</span>
                    </a>
                  ) : (
                    <span
                      key={index}
                      className="social-link social-link-placeholder"
                      style={{ '--icon-color': link.color }}
                      aria-label={`${link.name} profile coming soon`}
                      title={`${link.name} profile coming soon`}
                    >
                      <IconComponent aria-hidden="true" />
                      <span className="social-link-label">{link.name}</span>
                    </span>
                  )
                );
              })}
            </div>
          </section>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} CodeCanvas. All rights reserved.</p>
          <p className="developer">Made with love by C. Sivakumar</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

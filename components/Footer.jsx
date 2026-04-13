import React from 'react';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import '../app/footer.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: FaGithub,
      url: 'https://github.com/yourusername',
      color: '#333333'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      url: 'https://linkedin.com/in/yourusername',
      color: '#0077B5'
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      url: 'https://twitter.com/yourusername',
      color: '#1DA1F2'
    }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>CodeCraft</h3>
            <p>AI-powered developer tools and curated resources to accelerate your workflow.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/tools">Tools</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              {socialLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ '--icon-color': link.color }}
                    aria-label={link.name}
                  >
                    <IconComponent />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} CodeCraft. All rights reserved.</p>
          <p className="developer">Developed with ❤️ by C. Sivakumar</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
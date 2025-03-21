import React from 'react';
import { FaGithub, FaLinkedin, FaGlobe, FaInstagram } from 'react-icons/fa';
import '../styles/contact.scss';

const socialLinks = [
  {
    name: 'GitHub',
    icon: <FaGithub />,
    url: 'https://github.com/yourusername',
    color: '#333333'
  },
  {
    name: 'LinkedIn',
    icon: <FaLinkedin />,
    url: 'https://linkedin.com/in/yourusername',
    color: '#0077B5'
  },
  {
    name: 'Portfolio',
    icon: <FaGlobe />,
    url: 'https://yourportfolio.com',
    color: '#4CAF50'
  },
  {
    name: 'Instagram',
    icon: <FaInstagram />,
    url: 'https://instagram.com/yourusername',
    color: '#E4405F'
  }
];

const Contact = () => {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <h1>Get in Touch</h1>
        <div className="contact-content">
          <div className="contact-info">
            <h2>Connect With Me</h2>
            <p>
              Feel free to reach out through any of my social media platforms or
              check out my portfolio for more information about my work.
            </p>
            <div className="social-links">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  style={{ '--icon-color': link.color }}
                >
                  <span className="icon">{link.icon}</span>
                  <span className="name">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact; 
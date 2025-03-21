import React, { useState } from 'react';
import { FaGithub, FaLinkedin, FaGlobe, FaInstagram } from 'react-icons/fa';
import '../styles/contact.scss';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const socialLinks = [
    {
      name: 'GitHub',
      icon: <FaGithub />,
      url: 'https://github.com/yourusername',
      color: '#333'
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
      color: '#2ecc71'
    },
    {
      name: 'Instagram',
      icon: <FaInstagram />,
      url: 'https://instagram.com/yourusername',
      color: '#E4405F'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="contact">
      <div className="container">
        <h1>Get in Touch</h1>
        <div className="contact-content">
          <div className="contact-info">
            <h2>Let's Connect</h2>
            <p>
              Have questions or suggestions? We'd love to hear from you. Send us a message
              and we'll respond as soon as possible.
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
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact; 
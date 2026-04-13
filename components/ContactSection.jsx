"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import '../app/contact-section.scss';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message! I will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

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
    <section className="contact-section" id="contact">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Get In Touch</h2>
          <p>Have a question or want to collaborate? I'd love to hear from you.</p>
        </motion.div>

        <div className="contact-grid">
          {/* Contact Info Cards */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <div className="info-card">
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <div className="info-content">
                <h3>Email</h3>
                <p>your.email@example.com</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="info-content">
                <h3>Location</h3>
                <p>Your City, Country</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaPhone />
              </div>
              <div className="info-content">
                <h3>Phone</h3>
                <p>+1 (234) 567-8900</p>
              </div>
            </div>

            <div className="social-links-section">
              <h3>Follow Me</h3>
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
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="contact-form-wrapper"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
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
                  placeholder="your.email@example.com"
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
                  placeholder="Tell me about your project or question..."
                  rows="6"
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                Send Message
                <span>→</span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

import React, { useEffect, useRef } from 'react';
import { FaGithub, FaLinkedin, FaGlobe, FaInstagram, FaTwitter, FaDiscord, FaMedium, FaYoutube } from 'react-icons/fa';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/contact.scss';

gsap.registerPlugin(ScrollTrigger);

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
    name: 'Portfolio',
    icon: FaGlobe,
    url: 'https://yourportfolio.com',
    color: '#4CAF50'
  },
  {
    name: 'Instagram',
    icon: FaInstagram,
    url: 'https://instagram.com/yourusername',
    color: '#E4405F'
  },
  {
    name: 'Twitter',
    icon: FaTwitter,
    url: 'https://twitter.com/yourusername',
    color: '#1DA1F2'
  },
  {
    name: 'Discord',
    icon: FaDiscord,
    url: 'https://discord.gg/yourusername',
    color: '#7289DA'
  },
  {
    name: 'Medium',
    icon: FaMedium,
    url: 'https://medium.com/@yourusername',
    color: '#00AB6C'
  },
  {
    name: 'YouTube',
    icon: FaYoutube,
    url: 'https://youtube.com/@yourusername',
    color: '#FF0000'
  }
];

const Contact = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    
    // Animate heading
    gsap.from('h1', {
      y: -50,
      opacity: 1,
      duration: 1,
      scrollTrigger: {
        trigger: section,
        start: 'top center',
      }
    });

    // Animate description
    gsap.from('.contact-info h2, .contact-info p', {
      y: 30,
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: section,
        start: 'top center',
      }
    });

    // Animate social links
    gsap.from('.social-link', {
      scale: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.social-links',
        start: 'top bottom',
      }
    });
  }, []);

  return (
    <section className="contact" id="contact" ref={sectionRef}>
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
                  >
                    <span className="icon">
                      <IconComponent />
                    </span>
                    <span className="name">{link.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact; 
"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "../app/hero.scss";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    // Animate background gradient
    gsap.to('.hero', {
      backgroundPosition: '100% 100%',
      duration: 20,
      repeat: -1,
      ease: 'none'
    });

    // Animate hero content with stagger effect
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' }
    });

    tl.from('.hero-badge', {
      opacity: 0,
      y: 20,
      duration: 0.6
    })
    .from('.hero-content h1', {
      opacity: 0,
      y: 30,
      duration: 0.8
    }, '-=0.3')
    .from('.typewriter-container', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.4')
    .from('.hero-content p', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.3')
    .from('.hero-buttons', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.3')
    .from('.hero-stats', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.3');
  }, []);

  return (
    <section className="hero" ref={heroRef} id="hero">
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-icon">✨</span>
            <span className="badge-text">Free & Open Source Developer Tools</span>
          </motion.div>

          <h1 className="gradient-text">
            Build Faster with
            <br />
            AI-Powered Tools
          </h1>
          
          <div className="typewriter-container">
            <span className="typewriter-label">Generate</span>
            <Typewriter
              words={[
                'Color Palettes',
                'Gradients',
                'Box Shadows',
                'Code Snippets',
                'Responsive Layouts',
                'Project Ideas'
              ]}
              loop={true}
              cursor
              cursorStyle="|"
              typeSpeed={70}
              deleteSpeed={50}
            />
          </div>
          
          <p className="hero-description">
            Supercharge your development workflow with intelligent design tools, 
            AI code generators, and a curated collection of 50+ external resources.
          </p>
          
          <div className="hero-buttons">
            <Link href="/tools" className="primary-btn premium-btn">
              <span className="button-content">Explore All Tools</span>
              <span className="button-icon">🚀</span>
            </Link>
            <Link href="#featured" className="secondary-btn premium-btn">
              <span className="button-content">View Demo</span>
              <span className="button-icon">▶️</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">8+</span>
              <span className="stat-label">AI Tools</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Resources</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;




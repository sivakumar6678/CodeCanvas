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
      opacity: 1,
      y: 20,
      duration: 0.6
    })
      .from('.hero-content h1', {
        opacity: 1,
        y: 30,
        duration: 0.8
      }, '-=0.3')
      .from('.typewriter-container', {
        opacity: 1,
        y: 20,
        duration: 0.6
      }, '-=0.4')
      .from('.hero-content p', {
        opacity: 1,
        y: 20,
        duration: 0.6
      }, '-=0.3')
      .from('.hero-buttons', {
        opacity: 1,
        y: 20,
        duration: 0.6
      }, '-=0.3')
      .from('.hero-stats', {
        opacity: 1,
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
          <div className="hero-left">
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="badge-icon">✨</span>
              <span className="badge-text">Free & Open Source Developer Tools</span>
            </motion.div>

            <h1>
              Build Faster with
              <br />
              <span className="hero-highlight">AI-Powered Tools</span>
            </h1>

            <div className="typewriter-container">
              <span className="typewriter-label">Generate </span>
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

          <div className="hero-right">
            <div className="hero-visual">
              <div className="visual-card code-card">
                <div className="card-header">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="card-body">
                  <div className="code-line">
                    <span className="code-keyword">const</span>
                    <span className="code-function"> tools</span>
                    <span className="code-operator"> = </span>
                    <span className="code-string">'AI-Powered'</span>
                  </div>
                  <div className="code-line">
                    <span className="code-keyword">const</span>
                    <span className="code-function"> productivity</span>
                    <span className="code-operator"> = </span>
                    <span className="code-number">100</span>
                  </div>
                  <div className="code-line">
                    <span className="code-function">build</span>
                    <span className="code-punctuation">(</span>
                    <span className="code-string">'amazing'</span>
                    <span className="code-punctuation">)</span>
                  </div>
                </div>
              </div>

              <div className="visual-card color-card">
                <div className="color-palette">
                  <div className="color-swatch" style={{ background: '#667eea' }}></div>
                  <div className="color-swatch" style={{ background: '#764ba2' }}></div>
                  <div className="color-swatch" style={{ background: '#f093fb' }}></div>
                  <div className="color-swatch" style={{ background: '#4facfe' }}></div>
                  <div className="color-swatch" style={{ background: '#43e97b' }}></div>
                </div>
                <div className="color-label">Color Palette</div>
              </div>

              <div className="visual-card gradient-card">
                <div className="gradient-preview"></div>
                <div className="gradient-label">Gradient Generator</div>
              </div>

              <div className="floating-icon icon-1">🎨</div>
              <div className="floating-icon icon-2">⚡</div>
              <div className="floating-icon icon-3">🛠️</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;




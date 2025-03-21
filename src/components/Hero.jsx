import React, { useEffect, useRef } from 'react';
import { Typewriter } from 'react-simple-typewriter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "../styles/hero.scss";

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

    tl.from('.hero-content h1', {
      opacity: 0,
      y: 30,
      duration: 1
    })
    .from('.typewriter-container', {
      opacity: 0,
      y: 20,
      duration: 0.8
    }, '-=0.5')
    .from('.hero-content p', {
      opacity: 0,
      y: 20,
      duration: 0.8
    }, '-=0.5')
    .from('.search-container', {
      opacity: 0,
      y: 20,
      duration: 0.8
    }, '-=0.5')
    .from('.hero-buttons button', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.2
    }, '-=0.5');

    // Fade in elements on scroll
    gsap.utils.toArray('.fade-in').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 1
      });
    });
  }, []);

  return (
    <section className="hero" ref={heroRef} id="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Enhance Your Frontend Development</h1>
          <div className="typewriter-container">
            <Typewriter
              words={[
                'AI-Powered Tools',
                'Color Palettes',
                'Gradients',
                'Shadows',
                'Images'
              ]}
              loop={true}
              cursor
              cursorStyle="_"
              typeSpeed={70}
              deleteSpeed={50}
            />
          </div>
          <p>
            Find the best color palettes, gradients, images, and shadow generators
            for your projects using AI.
          </p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for tools..."
              className="search-input"
            />
            <button className="search-button">
              <span className="button-content">Search</span>
              <span className="button-icon">🔍</span>
            </button>
          </div>
          <div className="hero-buttons">
            <button className="primary-btn">
              <span className="button-content">Explore Colors</span>
              <span className="button-icon">🎨</span>
            </button>
            <button className="secondary-btn">
              <span className="button-content">Generate Shadows</span>
              <span className="button-icon">💫</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;




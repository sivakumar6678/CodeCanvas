"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../app/featured-tools.scss';

gsap.registerPlugin(ScrollTrigger);

const FeaturedTools = () => {
  const featuredTools = [
    {
      id: 1,
      title: 'Color Palette Generator',
      description: 'Generate beautiful color palettes using AI',
      icon: '🎨',
      path: '/tool/color-palette-generator'
    },
    {
      id: 2,
      title: 'Gradient Maker',
      description: 'Create stunning gradients with ease',
      icon: '🌈',
      path: '/tool/gradient-generator'
    },
    {
      id: 3,
      title: 'Shadow Generator',
      description: 'Design perfect shadows for your elements',
      icon: '💫',
      path: '/tool/box-shadow-generator'
    }
  ];

  useEffect(() => {
    gsap.from('.featured-tool', {
      scrollTrigger: {
        trigger: '.featured-tools',
        start: 'top center+=100',
        toggleActions: 'play none none reverse'
      },
      y: 60,
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }, []);

  return (
    <section className="featured-tools" id="featured">
      <div className="container">
        <h2>Featured Tools</h2>
        <p className="section-desc">Discover our most popular development tools</p>
        
        <div className="tools-grid">
          {featuredTools.map((tool) => (
            <Link href={tool.path} key={tool.id} className="featured-tool premium-card">
              <div className="tool-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <span className="tool-link gradient-text">Try it now →</span>
            </Link>
          ))}
        </div>

        <Link href="/tools" className="view-all-btn">
          View All Tools
          <span>→</span>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedTools; 
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaPalette, FaCode, FaLayerGroup, FaLightbulb, FaImage, FaMagic } from 'react-icons/fa';
import '../app/features-section.scss';

const FeaturesSection = () => {
  const features = [
    {
      icon: FaPalette,
      title: 'Color Tools',
      description: 'Generate beautiful color palettes and gradients with AI-powered suggestions',
      color: '#667eea'
    },
    {
      icon: FaMagic,
      title: 'Shadow Generator',
      description: 'Create perfect box shadows with intuitive controls and real-time preview',
      color: '#f093fb'
    },
    {
      icon: FaImage,
      title: 'Image Optimizer',
      description: 'Optimize images for web performance without losing quality',
      color: '#4facfe'
    },
    {
      icon: FaLayerGroup,
      title: 'Layout Generator',
      description: 'Build responsive layouts with AI-powered design suggestions',
      color: '#43e97b'
    },
    {
      icon: FaCode,
      title: 'Code Snippets',
      description: 'Generate production-ready code snippets for common patterns',
      color: '#fa709a'
    },
    {
      icon: FaLightbulb,
      title: 'Project Ideas',
      description: 'Get AI-powered project suggestions based on your interests',
      color: '#fee140'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section className="features-section" id="featured">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-badge">Features</span>
          <h2>Everything You Need to Build Faster</h2>
          <p>Powerful AI tools designed to supercharge your development workflow</p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="feature-icon-wrapper" style={{ background: `${feature.color}20` }}>
                  <IconComponent className="feature-icon" style={{ color: feature.color }} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

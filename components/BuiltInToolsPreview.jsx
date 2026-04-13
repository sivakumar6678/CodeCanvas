"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ToolCard from './ToolCard';
import { getFeaturedTools } from '../lib/toolData';
import '../app/builtin-tools-preview.scss';

const BuiltInToolsPreview = () => {
  const featuredTools = getFeaturedTools();

  return (
    <section className="builtin-tools-preview" id="tools-preview">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-badge">AI-Powered</span>
          <h2>Built with Intelligence</h2>
          <p>Experience the power of AI-driven development tools</p>
        </motion.div>

        <div className="tools-preview-grid">
          {featuredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="view-all-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/tools" className="view-all-btn">
            <span>Explore All Tools</span>
            <span className="arrow">→</span>
          </Link>
          <p className="tools-count">Browse 50+ tools and resources</p>
        </motion.div>
      </div>
    </section>
  );
};

export default BuiltInToolsPreview;

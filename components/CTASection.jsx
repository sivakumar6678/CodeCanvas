"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import '../app/cta-section.scss';

const CTASection = () => {
  return (
    <section className="cta-section">
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Ready to Build Better?</h2>
        <p>Explore our complete collection of developer tools and resources</p>
        <Link href="/tools" className="cta-button">
          Browse All Tools
          <span>→</span>
        </Link>
      </motion.div>
    </section>
  );
};

export default CTASection;

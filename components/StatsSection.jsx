"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaTools, FaBookOpen, FaGift, FaClock } from 'react-icons/fa';
import '../app/stats-section.scss';

const StatsSection = () => {
  const stats = [
    {
      value: '8+',
      label: 'AI Tools',
      icon: FaTools,
      color: '#667eea'
    },
    {
      value: '50+',
      label: 'External Resources',
      icon: FaBookOpen,
      color: '#f093fb'
    },
    {
      value: '100%',
      label: 'Free to Use',
      icon: FaGift,
      color: '#43e97b'
    },
    {
      value: '24/7',
      label: 'Available',
      icon: FaClock,
      color: '#4facfe'
    }
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="stat-item"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon-wrapper" style={{ background: `${stat.color}20` }}>
                  <IconComponent className="stat-icon" style={{ color: stat.color }} />
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

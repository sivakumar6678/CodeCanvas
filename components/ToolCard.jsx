"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../app/toolcard.scss';

const ToolCard = ({ tool }) => {
  const router = useRouter();
  const isBuiltin = tool.type === 'builtin';

  const handleAction = (e) => {
    e.stopPropagation();
    if (isBuiltin && tool.path) {
      router.push(tool.path);
    }
  };

  return (
    <motion.div
      className="tool-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <div className="tool-card-header">
        <span className="tool-card-icon">{tool.icon}</span>
        <span className="tool-card-badge">{tool.category}</span>
      </div>
      
      <h3 className="tool-card-title">{tool.name}</h3>
      <p className="tool-card-description">{tool.description}</p>
      
      <div className="tool-card-footer">
        {isBuiltin ? (
          <button className="tool-card-btn primary" onClick={handleAction}>
            Open Tool →
          </button>
        ) : (
          <a 
            href={tool.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tool-card-btn secondary"
          >
            Visit →
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default ToolCard;

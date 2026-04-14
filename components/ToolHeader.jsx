"use client";
import React from 'react';
import Link from 'next/link';
import '../app/toolheader.scss';

const ToolHeader = ({ tool }) => {
  if (!tool) return null;

  return (
    <div className="tool-header">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">/</span>
          <Link href="/tools">Tools</Link>
          <span className="separator">/</span>
          <span className="current">{tool.name}</span>
        </nav>

        {/* Tool Info */}
        <div className="tool-info">
          <div className="tool-info-header">
            <span className="tool-info-icon">{tool.icon}</span>
            <div className="tool-info-content">
              <h1>{tool.name}</h1>
              <span className="tool-info-badge">{tool.category}</span>
            </div>
          </div>
          <p className="tool-info-description">{tool.description}</p>
          
          <Link href="/tools" className="back-to-tools-btn">
            ← Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ToolHeader;

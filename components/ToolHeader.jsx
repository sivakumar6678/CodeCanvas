"use client";
import React from 'react';
import Link from 'next/link';
import '../app/toolheader.scss';

/**
 * ToolHeader — compact page header showing breadcrumb + tool identity.
 * Back button has been moved to the BackButton component at page level.
 */
const ToolHeader = ({ tool }) => {
  if (!tool) return null;

  return (
    <div className="tool-header">
      {/* Breadcrumb nav */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">/</span>
        <Link href="/tools">Tools</Link>
        <span className="separator">/</span>
        <span className="current">{tool.name}</span>
      </nav>

      {/* Tool identity: icon + name + category + short description */}
      <div className="tool-info">
        <div className="tool-info-header">
          <span className="tool-info-icon">{tool.icon}</span>
          <div className="tool-info-titles">
            <h1 className="tool-info-name">{tool.name}</h1>
            <span className="tool-info-badge">{tool.category}</span>
          </div>
        </div>
        <p className="tool-info-description">{tool.description}</p>
      </div>
    </div>
  );
};

export default ToolHeader;

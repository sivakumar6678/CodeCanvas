"use client";
import React from 'react';
import '../app/tooldescription.scss';

/**
 * ToolDescription — "About this tool" right-sidebar panel.
 * Sticky positioning is handled by the layout system (tool-page-layout.scss).
 */
const ToolDescription = ({ tool }) => {
  if (!tool || !tool.fullDescription) return null;

  return (
    <div className="tool-description-section">
      <div className="description-card">
        <h2>About this tool</h2>
        <p>{tool.fullDescription}</p>
      </div>
    </div>
  );
};

export default ToolDescription;

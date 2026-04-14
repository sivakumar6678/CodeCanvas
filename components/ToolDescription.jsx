"use client";
import React from 'react';
import '../app/tooldescription.scss';

const ToolDescription = ({ tool }) => {
  if (!tool || !tool.fullDescription) return null;

  return (
    <div className="tool-description-section w-full">
      <div className="description-card">
        <h2>About this tool</h2>
        <p>{tool.fullDescription}</p>
      </div>
    </div>
  );
};

export default ToolDescription;

"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import ToolHeader from '../../../components/ToolHeader';
import { builtinTools } from '../../../lib/toolData';

// Lazy load tool components
const toolsMap = {
  'brainstorming': dynamic(() => import('../../../components/tools_components/Brainstorming')),
  'code-snippet-generator': dynamic(() => import('../../../components/tools_components/CodeSnippetGenerator')),
  'project-suggestion': dynamic(() => import('../../../components/tools_components/ProjectSuggestion')),
  'color-palette-generator': dynamic(() => import('../../../components/tools_components/ColorPaletteGenerator')),
  'gradient-generator': dynamic(() => import('../../../components/tools_components/GradientGenerator')),
  'box-shadow-generator': dynamic(() => import('../../../components/tools_components/BoxShadowGenerator')),
  'image-optimizer': dynamic(() => import('../../../components/tools_components/ImageOptimizer')),
  'layout-generator': dynamic(() => import('../../../components/tools_components/LayoutGenerator')),
};

export default function ToolPage({ params }) {
  const { id } = params;
  const ToolComponent = toolsMap[id];

  if (!ToolComponent) {
    notFound();
  }

  // Get tool data for header
  const toolData = builtinTools.find(tool => tool.id === id);

  return (
    <div className="tool-page-container">
      {toolData && <ToolHeader tool={toolData} />}
      <div className="tool-component-wrapper">
        <ToolComponent />
      </div>
    </div>
  );
}

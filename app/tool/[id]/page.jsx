"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import ToolHeader from '../../../components/ToolHeader';
import ToolDescription from '../../../components/ToolDescription';
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
    <div className="tool-page-container mt-8 max-w-[1400px] mx-auto px-4 md:px-8 mb-16">
      {toolData && <ToolHeader tool={toolData} />}
      
      <div className="tool-content-main mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column - Main Tool Area */}
        <div className="tool-component-wrapper lg:col-span-8 xl:col-span-9 w-full">
          <ToolComponent />
        </div>
        
        {/* Right column - About Panel */}
        <div className="tool-description-panel lg:col-span-4 xl:col-span-3 sticky top-24">
          {toolData && <ToolDescription tool={toolData} />}
        </div>
      </div>
    </div>
  );
}

"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import ToolHeader from '../../../components/ToolHeader';
import ToolDescription from '../../../components/ToolDescription';
import BackButton from '../../../components/BackButton';
import { builtinTools } from '../../../lib/toolData';
import '../../../app/tool-page-layout.scss';

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

  const toolData = builtinTools.find(tool => tool.id === id);

  // Brainstorming is a chat-based tool — its inputs and outputs are
  // interleaved, so it stays as a full-width single-column layout.
  const isBrainstorming = id === 'brainstorming';

  return (
    <div className="tool-page-wrapper">
      {/* Back button — visible below navbar, outside main container */}
      <BackButton href="/tools" label="Back to Tools" />

      <div className="tool-page-container">
        {toolData && <ToolHeader tool={toolData} />}

        {isBrainstorming ? (
          // ── Full-width layout for Brainstorming ──────────────
          <div className="tool-content-full">
            <ToolComponent />
            <div className="tool-description-panel">
              {toolData && <ToolDescription tool={toolData} />}
            </div>
          </div>
        ) : (
          // ── Two-column grid: inputs LEFT | outputs+about RIGHT ─
          // tool-component-wrapper has display:contents (see SCSS),
          // which makes the tool root element and its pane children
          // participate directly in this grid.
          <div className="tool-content-main">
            <div className="tool-component-wrapper">
              <ToolComponent />
            </div>
            {/* About panel — right column, row 2 */}
            <div className="tool-description-panel">
              {toolData && <ToolDescription tool={toolData} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

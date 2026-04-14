"use client";
import React, { useState } from 'react';
import '../../app/tools_styles/LayoutGenerator.scss';

const LayoutGenerator = () => {
  const [layoutType, setLayoutType] = useState('grid');
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('200px');
  const [padding, setPadding] = useState('10px');
  const [margin, setMargin] = useState('10px');
  const [breakpoint, setBreakpoint] = useState('768px');
  const [generatedCode, setGeneratedCode] = useState('');
  const [previewConfig, setPreviewConfig] = useState(null);

  const handleGenerateCode = () => {
    const cssCode = `
      .layout {
        display: ${layoutType};
        width: ${width};
        height: ${height};
        padding: ${padding};
        margin: ${margin};
      }

      @media (max-width: ${breakpoint}) {
        .layout {
          flex-direction: column;
        }
      }
    `;

    const htmlCode = `
      <div class="layout">
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
      </div>
    `;

    setGeneratedCode(`HTML:\n${htmlCode}\n\nCSS:\n${cssCode}`);
    setPreviewConfig({ display: layoutType, width, height, padding, margin });
  };

  return (
    <div className="layout-generator">
      <div className="layout-builder-container">
        <div className="controls">
          <label>Layout Type</label>
          <select className="input-field" value={layoutType} onChange={(e) => setLayoutType(e.target.value)}>
            <option value="grid">CSS Grid</option>
            <option value="flex">Flexbox</option>
          </select>
        </div>
        <div className="input-group">
          <label>Width</label>
          <input className="input-field" type="text" value={width} onChange={(e) => setWidth(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Height</label>
          <input className="input-field" type="text" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Padding</label>
          <input className="input-field" type="text" value={padding} onChange={(e) => setPadding(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Margin</label>
          <input className="input-field" type="text" value={margin} onChange={(e) => setMargin(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Mobile Breakpoint</label>
          <input className="input-field" type="text" value={breakpoint} onChange={(e) => setBreakpoint(e.target.value)} />
        </div>
        <button onClick={handleGenerateCode} className="primary-btn w-full mt-4">Generate Layout Code</button>
      </div>
      
      {previewConfig && (
        <div className="preview">
          <h3 className="section-title">Preview</h3>
          <div className="layout" style={previewConfig}>
            <div className="item">Item 1</div>
            <div className="item">Item 2</div>
            <div className="item">Item 3</div>
          </div>
        </div>
      )}
      
      {generatedCode && (
        <div className="generated-code">
          <h3 className="section-title">Exported Code</h3>
          <textarea className="input-field" readOnly value={generatedCode} />
          <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="secondary-btn mt-3">Copy Code to Clipboard</button>
        </div>
      )}
    </div>
  );
};

export default LayoutGenerator;
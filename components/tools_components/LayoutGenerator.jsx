"use client";
import React, { useState } from 'react';
import '../../app/tools_styles/LayoutGenerator.scss';

const LayoutGenerator = () => {
  const [layoutType, setLayoutType] = useState('grid');
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('200px');
  const [padding, setPadding] = useState('1rem');
  const [gap, setGap] = useState('1rem');
  const [breakpoint, setBreakpoint] = useState('768px');
  const [generatedCode, setGeneratedCode] = useState('');
  const [previewConfig, setPreviewConfig] = useState(null);

  const handleGenerateCode = () => {
    const isGrid = layoutType === 'grid';
    
    // Core layout CSS
    const layoutRules = isGrid 
      ? `  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${gap};`
      : `  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: ${gap};`;

    const cssCode = `.layout-container {
${layoutRules}
  width: ${width};
  min-height: ${height};
  padding: ${padding};
  background: #f8f9fa;
  border-radius: 8px;
}

.layout-item {
  background: #ffffff;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

@media (max-width: ${breakpoint}) {
  .layout-container {
${isGrid ? '    grid-template-columns: 1fr;' : '    flex-direction: column;'}
  }
}`;

    const htmlCode = `<div class="layout-container">
  <div class="layout-item">Item 1</div>
  <div class="layout-item">Item 2</div>
  <div class="layout-item">Item 3</div>
</div>`;

    setGeneratedCode(`/* CSS */\n${cssCode}\n\n<!-- HTML -->\n${htmlCode}`);
    
    // Set live preview config
    setPreviewConfig({ 
      display: layoutType, 
      width, 
      minHeight: height, 
      padding, 
      gap: isGrid ? gap : gap,
      background: '#f8f9fa',
      borderRadius: '8px',
      gridTemplateColumns: isGrid ? 'repeat(auto-fit, minmax(100px, 1fr))' : undefined,
      flexDirection: isGrid ? undefined : 'row',
      justifyContent: isGrid ? undefined : 'space-between'
    });
  };

  const copyToClipboard = (e) => {
    navigator.clipboard.writeText(generatedCode);
    const btn = e.target;
    const oldText = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = oldText, 2000);
  };

  return (
    <div className="layout-generator">
      {/* ── LEFT: Inputs ──────────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="controls flex flex-col gap-4">
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Layout Type</label>
            <select className="input-field w-full border border-gray-300 p-2 rounded" value={layoutType} onChange={(e) => setLayoutType(e.target.value)}>
              <option value="grid">CSS Grid (Columns)</option>
              <option value="flex">Flexbox (Row)</option>
            </select>
          </div>
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Width</label>
            <input className="input-field w-full border border-gray-300 p-2 rounded" type="text" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 100%, 800px" />
          </div>
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Min Height</label>
            <input className="input-field w-full border border-gray-300 p-2 rounded" type="text" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 200px, auto" />
          </div>
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Padding</label>
            <input className="input-field w-full border border-gray-300 p-2 rounded" type="text" value={padding} onChange={(e) => setPadding(e.target.value)} placeholder="e.g. 1rem" />
          </div>
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Gap (Spacing)</label>
            <input className="input-field w-full border border-gray-300 p-2 rounded" type="text" value={gap} onChange={(e) => setGap(e.target.value)} placeholder="e.g. 1rem" />
          </div>
          <div className="input-group">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Mobile Stack Breakpoint</label>
            <input className="input-field w-full border border-gray-300 p-2 rounded" type="text" value={breakpoint} onChange={(e) => setBreakpoint(e.target.value)} placeholder="e.g. 768px" />
          </div>
          
          <button onClick={handleGenerateCode} className="primary-btn w-full mt-4 py-3 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition">
            Generate Layout
          </button>
        </div>
      </div>
      
      {/* ── RIGHT: Outputs ────────────────────────────── */}
      <div className="tool-outputs-pane flex flex-col gap-6">
        {!previewConfig && !generatedCode && (
           <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-gray-400">
             <span className="text-3xl mb-3">📐</span>
             <p className="text-sm font-medium">Layout preview will appear here</p>
             <p className="text-xs text-gray-300 mt-1">Configure layout properties and generate</p>
           </div>
        )}

        {previewConfig && (
          <div className="preview">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Representation</h3>
            <div className="border border-dashed border-gray-300 bg-white rounded flex items-center justify-center overflow-hidden p-2">
                <div style={{ ...previewConfig, width: '100%', maxWidth: '100%' }}>
                <div className="bg-indigo-100 border border-indigo-200 text-indigo-700 rounded p-4 text-center font-medium shadow-sm flex-1 min-w-[30%]">Item 1</div>
                <div className="bg-indigo-100 border border-indigo-200 text-indigo-700 rounded p-4 text-center font-medium shadow-sm flex-1 min-w-[30%]">Item 2</div>
                <div className="bg-indigo-100 border border-indigo-200 text-indigo-700 rounded p-4 text-center font-medium shadow-sm flex-1 min-w-[30%]">Item 3</div>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">(Representation scales to fit container)</p>
          </div>
        )}
        
        {generatedCode && (
          <div className="generated-code flex-grow flex flex-col">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Generated HTML/CSS</h3>
                <button onClick={copyToClipboard} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition border border-gray-200">
                    Copy Code
                </button>
            </div>
            <textarea 
                className="w-full flex-grow min-h-[250px] p-4 bg-[#1e1e1e] text-gray-100 font-mono text-sm rounded-lg border border-gray-800 outline-none resize-none" 
                readOnly 
                value={generatedCode} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutGenerator;
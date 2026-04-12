import React, { useState } from 'react';
import '../styles/tools_styles/LayoutGenerator.scss';

const LayoutGenerator = () => {
  const [layoutType, setLayoutType] = useState('grid');
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('200px');
  const [padding, setPadding] = useState('10px');
  const [margin, setMargin] = useState('10px');
  const [breakpoint, setBreakpoint] = useState('768px');
  const [generatedCode, setGeneratedCode] = useState('');

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
  };

  return (
    <div className="layout-generator">
      <h1>Layout Generator</h1>
      <div className="controls">
        <label>
          Layout Type:
          <select value={layoutType} onChange={(e) => setLayoutType(e.target.value)}>
            <option value="grid">Grid</option>
            <option value="flex">Flexbox</option>
          </select>
        </label>
        <label>
          Width:
          <input type="text" value={width} onChange={(e) => setWidth(e.target.value)} />
        </label>
        <label>
          Height:
          <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} />
        </label>
        <label>
          Padding:
          <input type="text" value={padding} onChange={(e) => setPadding(e.target.value)} />
        </label>
        <label>
          Margin:
          <input type="text" value={margin} onChange={(e) => setMargin(e.target.value)} />
        </label>
        <label>
          Breakpoint:
          <input type="text" value={breakpoint} onChange={(e) => setBreakpoint(e.target.value)} />
        </label>
        <button onClick={handleGenerateCode}>Generate Code</button>
      </div>
      <div className="preview">
        <h2>Layout Preview</h2>
        <div className="layout" style={{ display: layoutType, width, height, padding, margin }}>
          <div className="item">Item 1</div>
          <div className="item">Item 2</div>
          <div className="item">Item 3</div>
        </div>
      </div>
      <div className="generated-code">
        <h2>Generated Code</h2>
        <textarea readOnly value={generatedCode} />
        <button onClick={() => navigator.clipboard.writeText(generatedCode)}>Copy Code</button>
      </div>
    </div>
  );
};

export default LayoutGenerator;
"use client";
import React, { useState } from 'react';
import '../../app/tools_styles/boxshadowgenerator.scss';
import { generateBoxShadow } from '../../lib/apiService';
import { FaSync } from 'react-icons/fa';

export default function BoxShadowGenerator() {
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [blurRadius, setBlurRadius] = useState(5);
  const [spreadRadius, setSpreadRadius] = useState(0);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [opacity, setOpacity] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [aiMode, setAiMode] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const boxShadow = `${horizontalOffset}px ${verticalOffset}px ${blurRadius}px ${spreadRadius}px rgba(${parseInt(shadowColor.slice(1, 3), 16)}, ${parseInt(shadowColor.slice(3, 5), 16)}, ${parseInt(shadowColor.slice(5, 7), 16)}, ${opacity})`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`box-shadow: ${boxShadow};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAiSuggestion = async () => {
    setIsLoading(true);
    setError('');
    try {
      const suggestedShadow = await generateBoxShadow('Box', 'Calm', 'Nature');
      setAiSuggestion(suggestedShadow);
    } catch (err) {
      setError(err.message || 'Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="box-shadow-generator">
      {/* ── LEFT: Controls ──────────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="input-section">
          <label className="block mb-2">Horizontal Offset (X-axis):</label>
          <input type="range" min="-50" max="50" value={horizontalOffset}
            onChange={(e) => setHorizontalOffset(e.target.value)} className="range-field" />

          <label className="block mb-2 mt-4">Vertical Offset (Y-axis):</label>
          <input type="range" min="-50" max="50" value={verticalOffset}
            onChange={(e) => setVerticalOffset(e.target.value)} className="range-field" />

          <label className="block mb-2 mt-4">Blur Radius:</label>
          <input type="range" min="0" max="100" value={blurRadius}
            onChange={(e) => setBlurRadius(e.target.value)} className="range-field" />

          <label className="block mb-2 mt-4">Spread Radius:</label>
          <input type="range" min="-50" max="50" value={spreadRadius}
            onChange={(e) => setSpreadRadius(e.target.value)} className="range-field" />

          <label className="block mb-2 mt-4">Shadow Color:</label>
          <input type="color" value={shadowColor}
            onChange={(e) => setShadowColor(e.target.value)} className="color-field input-field" />

          <label className="block mb-2 mt-4">Opacity: <span className="text-indigo-600 font-bold">{opacity}</span></label>
          <input type="range" min="0" max="1" step="0.1" value={opacity}
            onChange={(e) => setOpacity(e.target.value)} className="range-field" />

          <label className="block mb-2 mt-4">Background Color:</label>
          <input type="color" value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)} className="color-field input-field" />
        </div>

        {/* AI Mode toggle */}
        <div className="ai-section mt-4 pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
            <input
              type="checkbox"
              checked={aiMode}
              onChange={() => setAiMode(!aiMode)}
              className="rounded"
            />
            Enable AI Suggestions
          </label>

          {aiMode && (
            <button
              onClick={handleGenerateAiSuggestion}
              disabled={isLoading}
              className="secondary-btn w-full flex items-center justify-center mt-3 gap-2 disabled:opacity-60"
            >
              {isLoading ? <><FaSync className="animate-spin" /> Generating...</> : '✨ Generate AI Shadow'}
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Preview + Output ──────────────────────── */}
      <div className="tool-outputs-pane">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Live preview */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Live Preview</p>
          <div
            className="preview-box"
            style={{ boxShadow, height: '100px', borderRadius: '8px', backgroundColor }}
          >
            <p className="text-center text-gray-500 text-sm">Preview Element</p>
          </div>
        </div>

        {/* CSS Output */}
        <div className="css-code mb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">CSS Code</p>
          <code className="block p-3 bg-gray-900 text-green-400 rounded-lg text-sm font-mono break-all">
            {`box-shadow: ${boxShadow};`}
          </code>
        </div>

        <button onClick={copyToClipboard} className={`primary-btn w-full ${copied ? '!bg-green-600' : ''}`}>
          {copied ? '✅ Copied!' : 'Copy CSS'}
        </button>

        {/* AI Suggestion output */}
        {aiSuggestion && (
          <div className="ai-suggestion mt-5 pt-5 border-t">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">AI Suggested Shadow</p>
            <div className="gradient-box" style={{ boxShadow: aiSuggestion, height: '100px', borderRadius: '8px', backgroundColor }}>
              <p className="text-center text-gray-600 text-xs font-mono">{aiSuggestion}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(`box-shadow: ${aiSuggestion};`)}
              className="primary-btn w-full mt-3">
              Copy AI Shadow CSS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

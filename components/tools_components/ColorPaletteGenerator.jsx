"use client";
import React, { useState, useEffect } from 'react';
import '../../app/tools_styles/colorpalettegenerator.scss';
import { generateColorPalette } from '../../lib/apiService';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas';
import { FaSync } from 'react-icons/fa';

const projectTypes = ['Website', 'Mobile App', 'Dashboard', 'E-commerce', 'Blog'];
const colorThemes = ['Dark', 'Pastel', 'Vibrant', 'Minimal'];
const colorFormats = ['HEX', 'RGB', 'HSL'];

const ColorPaletteGenerator = () => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [colorTheme, setColorTheme] = useState(colorThemes[0]);
  const [colorFormat, setColorFormat] = useState('HEX');
  const [palette, setPalette] = useState([]);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedPalette = loadPalette();
    if (savedPalette) setPalette(savedPalette);
  }, []);

  const savePalette = (palette) => {
    if (!Array.isArray(palette) || palette.length === 0) return;
    localStorage.setItem('savedPalette', JSON.stringify(palette));
  };

  const loadPalette = () => {
    const stored = localStorage.getItem('savedPalette');
    return stored ? JSON.parse(stored) : [];
  };

  const handleGeneratePalette = async () => {
    setIsLoading(true);
    setError('');
    setPalette([]);
    try {
      const theme = `${projectType} — ${colorTheme} theme${projectTitle ? `, titled "${projectTitle}"` : ''}${projectDescription ? `, for: ${projectDescription}` : ''}`;
      const newPalette = await generateColorPalette(theme);
      setPalette(newPalette);
    } catch (err) {
      setError(err.message || 'Failed to generate the palette. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (color) => {
    navigator.clipboard.writeText(color).then(() => alert(`Copied ${color} to clipboard!`));
  };

  const handleSavePalette = () => {
    savePalette(palette);
    alert('Palette saved locally!');
  };

  const handleExportJSON = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(palette))}`;
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'palette.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExportPNG = () => {
    const paletteElement = document.querySelector('.palette');
    if (!paletteElement) return;
    html2canvas(paletteElement).then(canvas => {
      const link = document.createElement('a');
      link.download = 'palette.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const handleToggleFavorite = (color) => {
    setFavorites(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  return (
    <div className="color-palette-generator">
      {/* ── LEFT: Inputs + Controls ──────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="input-section">
          <label>Project Title:</label>
          <input type="text" className="input-field" value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)} placeholder="Enter project title" />

          <label>Project Description:</label>
          <textarea className="input-field" value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Describe your project" />

          <label>Project Type:</label>
          <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
            {projectTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          <label>Color Theme:</label>
          <select value={colorTheme} onChange={(e) => setColorTheme(e.target.value)}>
            {colorThemes.map(theme => <option key={theme} value={theme}>{theme}</option>)}
          </select>

          <label>Color Format:</label>
          <select value={colorFormat} onChange={(e) => setColorFormat(e.target.value)}>
            {colorFormats.map(format => <option key={format} value={format}>{format}</option>)}
          </select>
        </div>

        <div className="button-group">
          <button className="primary-btn" onClick={handleGeneratePalette} disabled={isLoading}>
            {isLoading ? <><FaSync className="animate-spin mr-2" /> Generating...</> : 'Generate Palette 🎨'}
          </button>
          <button className="secondary-btn" onClick={handleSavePalette} disabled={palette.length === 0}>Save 💾</button>
          <button className="secondary-btn" onClick={handleExportJSON} disabled={palette.length === 0}>JSON 📄</button>
          <button className="secondary-btn" onClick={handleExportPNG} disabled={palette.length === 0}>PNG 📸</button>
        </div>
      </div>

      {/* ── RIGHT: Palette Output ─────────────────────────── */}
      <div className="tool-outputs-pane">
        {error && (
          <div className="error">⚠️ {error}</div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[140px] text-gray-400">
            <FaSync className="animate-spin text-indigo-400 text-2xl mb-3" />
            <p className="text-sm">Generating your palette...</p>
          </div>
        )}

        {!isLoading && palette.length > 0 && (
          <div className="palette">
            <h3>Generated Palette</h3>
            <div className="colors">
              {palette.map((color, index) => (
                <Draggable key={index}>
                  <div className="color-box" style={{ backgroundColor: color }}>
                    <span style={{ textShadow: "0px 1px 4px rgba(0,0,0,0.8)" }} className="color-hex">{color}</span>
                    <button onClick={() => handleCopyToClipboard(color)}>Copy</button>
                    <button onClick={() => handleToggleFavorite(color)}>
                      {favorites.includes(color) ? '★' : '☆'}
                    </button>
                  </div>
                </Draggable>
              ))}
            </div>
          </div>
        )}

        {!isLoading && palette.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center min-h-[140px] text-center text-gray-400">
            <span className="text-3xl mb-3">🎨</span>
            <p className="text-sm font-medium">Your color palette will appear here</p>
            <p className="text-xs text-gray-300 mt-1">Fill in your project details and generate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPaletteGenerator;
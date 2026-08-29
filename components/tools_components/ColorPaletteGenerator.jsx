"use client";
import React, { useState, useEffect } from 'react';
import '../../app/tools_styles/colorpalettegenerator.scss';
import { generateColorPalette } from '../../lib/apiService';
import { getContrastRatio, getWcagRating, generateTailwindConfig } from '../../lib/color-contrast';
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

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleCopyToClipboard = (color) => {
    navigator.clipboard.writeText(color).then(() => {
      showToast(`Copied ${color} to clipboard!`);
    });
  };

  const handleSavePalette = () => {
    savePalette(palette);
    showToast('Palette saved locally!');
  };

  const handleExportJSON = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(palette))}`;
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'palette.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Exported palette.json');
  };

  const handleExportTailwind = () => {
    const configStr = generateTailwindConfig(palette);
    navigator.clipboard.writeText(configStr).then(() => {
      showToast('Copied Tailwind CSS config to clipboard!');
    });
  };

  const handleExportPNG = () => {
    const paletteElement = document.querySelector('.palette');
    if (!paletteElement) return;
    html2canvas(paletteElement).then(canvas => {
      const link = document.createElement('a');
      link.download = 'palette.png';
      link.href = canvas.toDataURL();
      link.click();
      showToast('Exported palette.png');
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
          <button type="button" className="primary-btn" onClick={handleGeneratePalette} disabled={isLoading} suppressHydrationWarning>
            {isLoading ? <><FaSync className="animate-spin mr-2" /> Generating...</> : 'Generate Palette 🎨'}
          </button>
          <button type="button" className="secondary-btn" onClick={handleSavePalette} disabled={palette.length === 0} suppressHydrationWarning>Save 💾</button>
          <button type="button" className="secondary-btn" onClick={handleExportTailwind} disabled={palette.length === 0} suppressHydrationWarning>Tailwind 💅</button>
          <button type="button" className="secondary-btn" onClick={handleExportJSON} disabled={palette.length === 0} suppressHydrationWarning>JSON 📄</button>
          <button type="button" className="secondary-btn" onClick={handleExportPNG} disabled={palette.length === 0} suppressHydrationWarning>PNG 📸</button>
        </div>
      </div>

      {/* ── RIGHT: Palette Output ─────────────────────────── */}
      <div className="tool-outputs-pane">
        {toast && (
          <div style={{ padding: '8px 14px', background: '#ecfdf5', color: '#047857', borderRadius: '6px', marginBottom: '12px', fontSize: '0.88rem', fontWeight: 600, border: '1px solid rgba(4, 120, 87, 0.2)' }}>
            ✓ {toast}
          </div>
        )}

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
              {palette.map((color, index) => {
                const whiteRatio = getContrastRatio(color, '#ffffff').toFixed(1);
                const blackRatio = getContrastRatio(color, '#000000').toFixed(1);
                const whiteRating = getWcagRating(Number(whiteRatio));
                const blackRating = getWcagRating(Number(blackRatio));

                return (
                  <Draggable key={index}>
                    <div className="color-box" style={{ backgroundColor: color }}>
                      <span style={{ textShadow: "0px 1px 4px rgba(0,0,0,0.8)" }} className="color-hex">{color}</span>
                      
                      <div style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '4px', padding: '2px 6px', margin: '4px 0' }}>
                        <span>vs ☀️: {blackRatio}:1 ({blackRating})</span><br />
                        <span>vs 🌙: {whiteRatio}:1 ({whiteRating})</span>
                      </div>

                      <button type="button" onClick={() => handleCopyToClipboard(color)} suppressHydrationWarning>Copy</button>
                      <button type="button" onClick={() => handleToggleFavorite(color)} suppressHydrationWarning>
                        {favorites.includes(color) ? '★' : '☆'}
                      </button>
                    </div>
                  </Draggable>
                );
              })}
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
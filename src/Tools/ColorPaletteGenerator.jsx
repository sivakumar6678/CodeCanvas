import React, { useState, useEffect } from 'react';
import '../styles/tools_styles/colorpalettegenerator.scss'; 
import { generateColorPalette } from '../apiService';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas';

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
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedPalette = loadPalette();
        if (savedPalette) {
            setPalette(savedPalette);
        }
    }, []);
    const savePalette = (palette) => {
        if (!Array.isArray(palette) || palette.length === 0) return;
        localStorage.setItem('savedPalette', JSON.stringify(palette));
    };
    
    const loadPalette = () => {
        const storedPalette = localStorage.getItem('savedPalette');
        return storedPalette ? JSON.parse(storedPalette) : [];
    };
    

    const handleGeneratePalette = async () => {
        try {
            setError('');
            setPalette([]);
            const newPalette = await generateColorPalette(projectTitle, projectDescription, colorTheme);
            setPalette(newPalette);
        } catch (err) {
            setError(err.message || 'Failed to generate the palette.');
        }
    };

    const handleCopyToClipboard = (color) => {
        navigator.clipboard.writeText(color).then(() => alert(`Copied ${color} to clipboard!`));
    };

    const handleSavePalette = () => {
        savePalette(palette);
        alert('Palette saved!');
    };

    const handleExportJSON = () => {
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(palette))}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', 'palette.json');
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportPNG = () => {
        const paletteElement = document.querySelector('.palette');
        html2canvas(paletteElement).then(canvas => {
            const link = document.createElement('a');
            link.download = 'palette.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    const handleToggleFavorite = (color) => {
        setFavorites((prevFavorites) =>
            prevFavorites.includes(color) ? prevFavorites.filter(c => c !== color) : [...prevFavorites, color]
        );
    };

    return (
        <div className={`color-palette-generator ${darkMode ? 'dark-mode' : ''}`}>
            <h2>Color Palette Generator</h2>
            <div className="input-section">
                <label>Project Title:</label>
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Enter project title" />
                
                <label>Project Description:</label>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Describe your project"></textarea>
                
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
                
                <button onClick={handleGeneratePalette}>Generate Palette</button>
                <button onClick={handleSavePalette}>Save Palette</button>
                <button onClick={handleExportJSON}>Export as JSON</button>
                <button onClick={handleExportPNG}>Export as PNG</button>
            </div>
            
            {error && <div className="error">⚠️ {error}</div>}
            
            {palette.length > 0 && (
                <div className="palette">
                    <h3>Generated Palette</h3>
                    <div className="colors">
                        {palette.map((color, index) => (
                            <Draggable key={index}>
                                <div className="color-box" style={{ backgroundColor: color }}>
                                    <span className="color-hex">{color}</span>
                                    <button onClick={() => handleCopyToClipboard(color)}>Copy HEX</button>
                                    <button onClick={() => handleToggleFavorite(color)}>
                                        {favorites.includes(color) ? '★' : '☆'}
                                    </button>
                                </div>
                            </Draggable>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPaletteGenerator;
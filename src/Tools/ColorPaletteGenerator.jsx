import React, { useState } from 'react';
import '../styles/tools_styles/colorpalettegenerator.scss'; 
import { generateColorPalette } from '../apiService';

const projectTypes = ['Website', 'Mobile App', 'Dashboard', 'E-commerce', 'Blog'];
const colorThemes = ['Dark', 'Pastel', 'Vibrant', 'Minimal'];

const ColorPaletteGenerator = () => {
    const [projectType, setProjectType] = useState(projectTypes[0]);
    const [colorTheme, setColorTheme] = useState(colorThemes[0]);
    const [palette, setPalette] = useState([]);
    const [error, setError] = useState('');

    const handleGeneratePalette = async () => {
        try {
            setError('');
            setPalette([]); // Reset before fetching
            const newPalette = await generateColorPalette(colorTheme);
            console.log('Generated Palette:', newPalette);

            if (Array.isArray(newPalette) && newPalette.length > 0) {
                setPalette(newPalette);
            } else {
                throw new Error('Received an invalid palette format.');
            }
        } catch (err) {
            console.error('❌ Error generating palette:', err);
            setError(err.message || 'Failed to generate the palette.');
        }
    };

    const handleCopyToClipboard = (color) => {
        navigator.clipboard.writeText(color)
            .then(() => alert(`Copied ${color} to clipboard!`))
            .catch((err) => console.error('Clipboard copy failed:', err));
    };

    return (
        <div className="color-palette-generator">
            <h2>Color Palette Generator</h2>
            <div className="input-section">
                <label htmlFor="project-type">Select Project Type:</label>
                <select
                    id="project-type"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                >
                    {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>

                <label htmlFor="color-theme">Choose Color Theme:</label>
                <select
                    id="color-theme"
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value)}
                >
                    {colorThemes.map((theme) => (
                        <option key={theme} value={theme}>{theme}</option>
                    ))}
                </select>

                <button className="generate-btn" onClick={handleGeneratePalette}>
                    Generate Palette
                </button>
            </div>

            {error && <div className="error">⚠️ {error}</div>}

            {palette.length > 0 && (
                <div className="palette">
                    <h3>Generated Palette</h3>
                    <div className="colors">
                        {palette.map((color, index) => (
                            <div key={index} className="color-box" style={{ backgroundColor: color }}>
                                <span className="color-hex">{color}</span>
                                <button className="copy-btn" onClick={() => handleCopyToClipboard(color)}>
                                    Copy HEX
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPaletteGenerator;

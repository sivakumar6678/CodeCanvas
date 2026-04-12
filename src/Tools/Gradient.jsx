import React, { useState } from 'react';
import { generateGradients } from '../apiService'; // Ensure this function is implemented in apiService.js
import '../styles/tools_styles/gradient.scss';
import { FaSync } from 'react-icons/fa';

const projectTypes = ['Portfolio', 'Startup', 'E-commerce', 'Blog', 'Social Media', 'Landing Page', 'Other'];
const moods = ['Calm', 'Energetic', 'Luxury', 'Playful', 'Serene', ];
const themes = ['Nature', 'Futuristic', 'Vintage', 'Minimalist', 'Bold'];

const Gradient = () => {
    const [projectType, setProjectType] = useState(projectTypes[0]);
    const [mood, setMood] = useState(moods[0]);
    const [theme, setTheme] = useState(themes[0]);
    const [gradients, setGradients] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateGradient = async () => {
        setIsLoading(true);
        try {
            setError('');
            const response = await generateGradients(projectType, mood, theme);
            if (Array.isArray(response) && response.length > 0) {
                setGradients(response);
            } else {
                throw new Error('Invalid gradient format received');
            }
        } catch (err) {
            setError(err.message || 'Failed to generate the gradient.');
            setGradients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (gradient) => {
        navigator.clipboard.writeText(gradient);
        alert(`Copied: ${gradient}`);
    };

    const applyGradient = (gradient) => {
        return typeof gradient === 'string' && gradient.startsWith('linear-gradient')
            ? gradient
            : 'linear-gradient(to right, #ffffff, #000000)'; // Default fallback
    };

    return (
        <div className="gradinet-main">

        
        <div className="gradient-generator p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">CSS Gradient Generator</h2>
            <div className="input-section mb-4">
                <label className="block mb-2">Project Type:</label>
                <select 
                    value={projectType} 
                    onChange={(e) => {
                        const selectedType = e.target.value;
                        setProjectType(selectedType);
                        if (selectedType === 'Other') {
                            const projectName = prompt('Please enter your project name:');
                            if (projectName) {
                                // You can handle the project name as needed here
                                console.log(`Project Name: ${projectName}`);
                                // Optionally, you can set the projectType to the projectName
                                setProjectType(projectName);
                            }
                        }
                    }} 
                    className="border p-2 rounded w-full"
                >
                    {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>

                <label className="block mb-2 mt-4">Mood:</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)} className="border p-2 rounded w-full">
                    {moods.map((mood) => (
                        <option key={mood} value={mood}>{mood}</option>
                    ))}
                </select>

                <label className="block mb-2 mt-4">Theme:</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)} className="border p-2 rounded w-full">
                    {themes.map((theme) => (
                        <option key={theme} value={theme}>{theme}</option>
                    ))}
                </select>

                <button onClick={handleGenerateGradient} className="mt-4 bg-blue-600 text-white p-2 rounded w-full flex items-center justify-center">
                    {isLoading ? <FaSync className="animate-spin mr-2" /> : 'Generate Gradient 🎨'}
                </button>
            </div>

            {error && <div className="error text-red-500 text-center mb-4">{error}</div>}

            <div style={{ marginTop: '20px' }}>
                {gradients.length > 0 ? (
                    gradients.map((gradient, index) => (
                        <div 
                            key={index} 
                            className="gradient-box p-4 rounded-lg mb-2 flex justify-between items-center"
                            style={{ background: applyGradient(gradient) }}
                        >
                            <span className="text-white font-bold">{gradient}</span>
                            <button onClick={() => copyToClipboard(gradient)} className="bg-green-500 text-white p-2 rounded">
                                Copy
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No gradients found.</p>
                )}
            </div>
        </div>
        </div>
    );
};

export default Gradient;

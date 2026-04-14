"use client";
import React, { useState } from 'react';
import { generateGradients } from '../../lib/apiService';
import '../../app/tools_styles/gradient.scss';
import { FaSync } from 'react-icons/fa';

const projectTypes = ['Portfolio', 'Startup', 'E-commerce', 'Blog', 'Social Media', 'Landing Page', 'Other'];
const moods = ['Calm', 'Energetic', 'Luxury', 'Playful', 'Serene'];
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
        setError('');
        try {
            const response = await generateGradients(projectType, mood, theme);
            if (Array.isArray(response) && response.length > 0) {
                setGradients(response);
            } else {
                throw new Error('Failed to parse gradients. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Failed to generate gradients.');
            setGradients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (gradient, e) => {
        navigator.clipboard.writeText(gradient);
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.classList.add('bg-green-100', 'text-green-700', 'border-green-300');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('bg-green-100', 'text-green-700', 'border-green-300');
        }, 1500);
    };

    const applyGradient = (gradient) => {
        return typeof gradient === 'string' && gradient.startsWith('linear-gradient')
            ? gradient
            : 'linear-gradient(to right, #ffffff, #000000)';
    };

    return (
        <div className="gradient-generator">
            {/* ── LEFT: Inputs ──────────────────────────────── */}
            <div className="tool-inputs-pane">
                <div className="input-section">
                    <label>Project Type:</label>
                    <select 
                        value={projectType} 
                        onChange={(e) => {
                            const selectedType = e.target.value;
                            if (selectedType === 'Other') {
                                const projectName = prompt('Please enter your project name:');
                                if (projectName) setProjectType(projectName);
                            } else {
                                setProjectType(selectedType);
                            }
                        }} 
                    >
                        {projectTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <label>Mood:</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                        {moods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <label>Theme:</label>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                        {themes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleGenerateGradient} 
                        disabled={isLoading}
                        className="primary-btn flex items-center justify-center mt-6 w-full disabled:opacity-70"
                    >
                        {isLoading ? <><FaSync className="animate-spin mr-2" /> Generating...</> : 'Generate Gradients 🎨'}
                    </button>
                </div>
            </div>

            {/* ── RIGHT: Outputs ────────────────────────────── */}
            <div className="tool-outputs-pane">
                {error && <div className="error text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4 text-sm font-medium">⚠️ {error}</div>}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[140px] text-gray-400">
                        <FaSync className="animate-spin text-indigo-400 text-2xl mb-3" />
                        <p className="text-sm">Creating stunning gradients...</p>
                    </div>
                )}

                {!isLoading && gradients.length > 0 && (
                    <div className="gradient-output">
                        {gradients.map((gradient, index) => (
                            <div 
                                key={index} 
                                className="gradient-box p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex flex-col sm:flex-row justify-between items-center transition-all hover:shadow-md"
                                style={{ background: applyGradient(gradient) }}
                            >
                                <span className="font-mono text-white text-sm mb-2 sm:mb-0 text-shadow-sm drop-shadow-md">{gradient}</span>
                                <button 
                                    onClick={(e) => copyToClipboard(gradient, e)} 
                                    className="secondary-btn text-sm whitespace-nowrap bg-white/90 text-gray-800 hover:bg-white"
                                >
                                    Copy CSS
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && gradients.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center min-h-[140px] text-center text-gray-400">
                        <span className="text-3xl mb-3">🌈</span>
                        <p className="text-sm font-medium">Your gradients will appear here</p>
                        <p className="text-xs text-gray-300 mt-1">Select your theme and generate</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gradient;

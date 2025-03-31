import React, { useState } from 'react';
import '../styles/tools_styles/boxshadowgenerator.scss'; // Import your styles
import { generateBoxShadow } from '../apiService';
import { FaSync } from 'react-icons/fa';
export default function BoxShadowGenerator()  {
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

    const boxShadow = `${horizontalOffset}px ${verticalOffset}px ${blurRadius}px ${spreadRadius}px rgba(${parseInt(shadowColor.slice(1, 3), 16)}, ${parseInt(shadowColor.slice(3, 5), 16)}, ${parseInt(shadowColor.slice(5, 7), 16)}, ${opacity})`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`box-shadow: ${boxShadow};`);
        alert(`Copied CSS: box-shadow: ${boxShadow};`);
    };

    const handleGenerateAiSuggestion = async () => {
        setIsLoading(true);
        try {
            const suggestedShadow = await generateBoxShadow('Box', 'Calm', 'Nature'); // Replace with actual values
            setAiSuggestion(suggestedShadow);
        } catch (err) {
            setError(err.message || 'Failed to generate AI suggestion');
        } finally {
            setIsLoading(false);
        }
    };

    const applyGradient = (gradient) => {
        return typeof gradient === 'string' && gradient.startsWith('linear-gradient')
            ? gradient
            : 'linear-gradient(to right, #ffffff, #000000)'; // Default fallback
    };

    return (
        <div className="box-shadow-generator p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Box Shadow Generator</h2>
            <div className="input-section mb-4">
                <label className="block mb-2">Horizontal Offset (X-axis):</label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={horizontalOffset}
                    onChange={(e) => setHorizontalOffset(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Vertical Offset (Y-axis):</label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={verticalOffset}
                    onChange={(e) => setVerticalOffset(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Blur Radius:</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Spread Radius:</label>
                <input
                    type="range"
                    min="-50"
                    max="50"
                    value={spreadRadius}
                    onChange={(e) => setSpreadRadius(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Shadow Color:</label>
                <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => setShadowColor(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Opacity:</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(e.target.value)}
                    className="w-full"
                />

                <label className="block mb-2">Background Color:</label>
                <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="preview-box mb-4" style={{ boxShadow: boxShadow, height: '100px', borderRadius: '8px', backgroundColor: backgroundColor }}>
                <p className="text-center">Preview Box</p>
            </div>

            <div className="css-code text-center mb-4">
                <p className="font-bold">CSS Code:</p>
                <code>{`box-shadow: ${boxShadow};`}</code>
            </div>

            <button onClick={copyToClipboard} className="bg-blue-500 text-white p-2 rounded w-full">
                Copy CSS
            </button>

            <div className="ai-section mt-4">
                <label className="block mb-2">
                    <input
                        type="checkbox"
                        checked={aiMode}
                        onChange={() => setAiMode(!aiMode)}
                    />
                    Enable AI Suggestions
                </label>

                {aiMode && (
                    <>
                        <button onClick={handleGenerateAiSuggestion} className="bg-green-500 text-white p-2 rounded w-full">
                            {isLoading ? <FaSync className="animate-spin mr-2" /> : 'Generate AI Suggestion'}       
                        </button>
                        {aiSuggestion && (
                            <div className="ai-suggestion mt-4">
                                <h3 className="font-bold">AI Suggested Box Shadow:</h3>
                                <div className="gradient-box" style={{ boxShadow: aiSuggestion, height: '100px', borderRadius: '8px', backgroundColor: backgroundColor }}>
                                    <p className="text-center">{aiSuggestion}</p>
                                </div>
                                <button onClick={() => copyToClipboard(aiSuggestion)} className="bg-blue-500 text-white p-2 rounded w-full">
                                    Copy AI CSS
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};



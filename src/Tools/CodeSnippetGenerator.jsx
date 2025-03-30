import React, { useState } from 'react';
import { FaCopy, FaDownload, FaSync, FaCode } from 'react-icons/fa';
import "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import { generateCodeSnippet } from '../apiService';
import '../styles/tools_styles/codeSnippetGenerator.scss';

const CodeSnippetGenerator = () => {
  const [description, setDescription] = useState('');
  const [snippets, setSnippets] = useState([]); // Change to an array to hold multiple snippets
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await generateCodeSnippet(description);
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const responseText = data.candidates[0].content.parts[0].text;

        // Update regex to capture multiple languages and codes
        const regex = /LANGUAGE:\s*(\w+)\s*CODE:\s*([\s\S]*?)(?=LANGUAGE:|$)/g;
        const newSnippets = [];
        let match;

        while ((match = regex.exec(responseText)) !== null) {
          newSnippets.push({
            language: match[1].toLowerCase(),
            code: match[2].trim(),
          });
        }

        if (newSnippets.length > 0) {
          setSnippets(newSnippets);
        } else {
          setError('Failed to parse AI response');
        }
      } else {
        setError('Failed to generate code');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy code');
    }
  };

  const downloadCode = (code, language) => {
    const extension = language === 'javascript' ? 'js' : 
                     language === 'css' ? 'css' : 'html';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refineCode = () => {
    setDescription(prev => `${prev} (refined)`);
    generateCode();
  };

  return (
    <div className="code-snippet-generator">
      <div className="container">
        <h1>AI Code Snippet Generator</h1>
        <p className="subtitle">Describe what you want, and AI will generate the code for you</p>

        <div className="input-section">
          <div className="input-container">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the code you want (e.g., 'CSS card hover effect')"
              className="description-input"
            />
            <button 
              onClick={generateCode}
              disabled={isLoading}
              className="generate-btn"
            >
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {snippets.length > 0 && (
          <div className="code-section">
            {snippets.map((snippet, index) => (
              <div key={index} className="snippet">
                <div className="code-header">
                  <div className="language-badge">
                    <FaCode /> {snippet.language.toUpperCase()}
                  </div>
                  <div className="code-actions">
                    <button 
                      onClick={() => copyToClipboard(snippet.code)}
                      className={`action-btn ${copied ? 'copied' : ''}`}
                    >
                      <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => downloadCode(snippet.code, snippet.language)} className="action-btn">
                      <FaDownload /> Download
                    </button>
                    <button onClick={refineCode} className="action-btn">
                      <FaSync /> Refine
                    </button>
                  </div>
                </div>
                <pre className="code-display">
                  <code className={`language-${snippet.language}`}>
                    {snippet.code}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetGenerator; 
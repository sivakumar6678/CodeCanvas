import React, { useState } from 'react';
import { FaCopy, FaDownload, FaSync, FaCode } from 'react-icons/fa';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // You can choose a different theme if you prefer

import { generateCodeSnippet } from '../apiService';
import '../styles/tools_styles/codeSnippetGenerator.scss';

const CodeSnippetGenerator = () => {
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
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
        const languageMatch = responseText.match(/LANGUAGE:\s*(\w+)/i);
        const codeMatch = responseText.match(/CODE:\s*([\s\S]+)/i);

        if (languageMatch && codeMatch) {
          setLanguage(languageMatch[1].toLowerCase());
          setCode(codeMatch[1].trim());
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy code');
    }
  };

  const downloadCode = () => {
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

        {code && (
          <div className="code-section">
            <div className="code-header">
              <div className="language-badge">
                <FaCode /> {language.toUpperCase()}
              </div>
              <div className="code-actions">
                <button 
                  onClick={copyToClipboard}
                  className={`action-btn ${copied ? 'copied' : ''}`}
                >
                  <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadCode} className="action-btn">
                  <FaDownload /> Download
                </button>
                <button onClick={refineCode} className="action-btn">
                  <FaSync /> Refine
                </button>
              </div>
            </div>
            <pre className="code-display">
              <code className={`language-${language}`}>
                {Prism.highlight(code, Prism.languages[language], language)}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetGenerator; 
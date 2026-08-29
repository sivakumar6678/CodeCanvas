'use client';

import React, { useState } from 'react';
import {
  FaCopy,
  FaDownload,
  FaMagic,
  FaFileCode,
  FaKeyboard,
} from 'react-icons/fa';
import 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import { generateCodeSnippet } from '../../lib/apiService';
import '../../app/tools_styles/codeSnippetGenerator.scss';

const LANGUAGES = [
  'All / Auto',
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'SQL',
  'HTML & CSS',
  'React',
];

const PRESETS = [
  { label: 'Debounce Hook', query: 'Custom React useDebounce hook with TypeScript types' },
  { label: 'JWT Auth Middleware', query: 'Next.js API route JWT authentication middleware' },
  { label: 'PostgreSQL Pool', query: 'PostgreSQL connection pool setup with error handling' },
  { label: 'Binary Search Tree', query: 'TypeScript Binary Search Tree with insert and search' },
  { label: 'Tailwind Modal', query: 'Accessible Tailwind CSS animated dialog modal component' },
];

const EXT_MAP = {
  typescript: 'ts',
  javascript: 'js',
  python: 'py',
  rust: 'rs',
  go: 'go',
  sql: 'sql',
  html: 'html',
  css: 'css',
  jsx: 'jsx',
  tsx: 'tsx',
  react: 'tsx',
};

const CodeSnippetGenerator = () => {
  const [description, setDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const generateCode = async (customDesc) => {
    const queryToUse = customDesc || description;
    if (!queryToUse.trim()) {
      setError('Please describe the code you want to generate.');
      return;
    }
    setIsLoading(true);
    setError('');

    const promptText = selectedLanguage !== 'All / Auto'
      ? `${queryToUse} in ${selectedLanguage}`
      : queryToUse;

    try {
      const data = await generateCodeSnippet(promptText);
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const responseText = data.candidates[0].content.parts[0].text;
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
          // Fallback parsing for raw markdown block
          const codeMatch = responseText.match(/```(\w+)?\s*([\s\S]*?)```/);
          if (codeMatch) {
            setSnippets([
              {
                language: (codeMatch[1] || selectedLanguage || 'typescript').toLowerCase(),
                code: codeMatch[2].trim(),
              },
            ]);
          } else {
            setSnippets([
              {
                language: (selectedLanguage !== 'All / Auto' ? selectedLanguage : 'typescript').toLowerCase(),
                code: responseText.trim(),
              },
            ]);
          }
        }
      } else {
        setError('No code was generated. Please try a different description.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate code snippet.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard.');
    }
  };

  const downloadCode = (code, language) => {
    const extension = EXT_MAP[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded snippet.${extension}`);
  };

  const handleApplyPreset = (preset) => {
    setDescription(preset.query);
    generateCode(preset.query);
  };

  return (
    <div className="code-snippet-generator">
      {/* ── LEFT: Input controls ─────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="input-panel">
          <div className="lang-select-wrapper">
            <label>Target Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="prompt-wrapper">
            <label>Code Description</label>
            <div className="input-row">
              <FaKeyboard className="input-icon" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., 'React debounce hook with TypeScript'"
                onKeyDown={(e) => { if (e.key === 'Enter') generateCode(); }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => generateCode()}
            disabled={isLoading}
            className="generate-btn"
            suppressHydrationWarning
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Code...
              </>
            ) : (
              <><FaMagic /> Generate Snippet</>
            )}
          </button>

          {/* Starter Presets */}
          <div className="starters-section">
            <span className="starters-label">Quick Starters:</span>
            <div className="starters-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="starter-chip"
                  suppressHydrationWarning
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Outputs ───────────────────────────────── */}
      <div className="tool-outputs-pane">
        {toast && (
          <div className="toast-alert">
            ✓ {toast}
          </div>
        )}

        {error && (
          <div className="alert-error">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="snippets-stack">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 bg-gray-200 rounded w-20" />
                  <div className="flex gap-2">
                    <div className="h-7 bg-gray-200 rounded w-16" />
                    <div className="h-7 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="h-40 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Generated snippets */}
        {!isLoading && snippets.length > 0 && (
          <div className="snippets-stack">
            {snippets.map((snippet, index) => (
              <div key={index} className="snippet-card">
                <div className="snippet-header">
                  <span className="lang-tag">
                    <FaFileCode /> {snippet.language}
                  </span>
                  <div className="snippet-actions">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(snippet.code)}
                      suppressHydrationWarning
                    >
                      <FaCopy /> {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCode(snippet.code, snippet.language)}
                      suppressHydrationWarning
                    >
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
                <pre className="code-body">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Empty placeholder */}
        {!isLoading && snippets.length === 0 && !error && (
          <div className="empty-output">
            <span className="empty-icon">🖥️</span>
            <p>Generated code will appear here</p>
            <small>Select a language or starter preset on the left</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetGenerator;
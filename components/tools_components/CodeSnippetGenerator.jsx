import React, { useState } from 'react';
import { 
  FaCopy, 
  FaDownload, 
  FaMagic, 
  FaFileCode, 
  FaKeyboard 
} from 'react-icons/fa';
import "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import { generateCodeSnippet } from '../../lib/apiService';
import '../../app/tools_styles/codeSnippetGenerator.scss';

const CodeSnippetGenerator = () => {
  const [description, setDescription] = useState('');
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateCode = async () => {
    if (!description.trim()) {
      setError('Please describe the code you want to generate.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const data = await generateCodeSnippet(description);
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
          setError('Failed to parse the AI response. Please try again.');
        }
      } else {
        setError('No code was generated. Please try a different description.');
      }
    } catch (err) {
      setError(err.message);
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
      setError('Failed to copy to clipboard.');
    }
  };

  const downloadCode = (code, language) => {
    const extension = language === 'javascript' ? 'js' : language === 'css' ? 'css' : 'html';
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

  return (
    <div className="code-snippet-generator">
      {/* ── LEFT: Input controls ─────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="input-container flex flex-col md:flex-row gap-4">
          <div className="input-wrapper flex-grow flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <FaKeyboard className="text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the code you want (e.g., 'CSS card hover effect')"
              className="description-input w-full bg-transparent border-none outline-none text-gray-700 py-2"
              onKeyDown={(e) => { if (e.key === 'Enter') generateCode(); }}
            />
          </div>
          <button
            onClick={generateCode}
            disabled={isLoading}
            className="generate-btn w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <><FaMagic /> Generate Code</>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium text-gray-600 mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-400">
            <li>Be specific — "React useState hook example" works better than "React code"</li>
            <li>Mention the language if needed — "Python FastAPI endpoint"</li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT: Outputs ───────────────────────────────── */}
      <div className="tool-outputs-pane">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
            {[1, 2].map(i => (
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
          <div className="code-section grid grid-cols-1 xl:grid-cols-2 gap-5 w-full">
            {snippets.map((snippet, index) => (
              <div key={index} className="snippet bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="code-header bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
                  <div className="language-badge flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaFileCode className="text-indigo-500" /> {snippet.language.toUpperCase()}
                  </div>
                  <div className="code-actions flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(snippet.code)}
                      className={`action-btn text-sm px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadCode(snippet.code, snippet.language)}
                      className="action-btn text-sm px-3 py-1.5 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                    >
                      <FaDownload className="hidden sm:block" />
                      <span className="hidden sm:block">Download</span>
                    </button>
                  </div>
                </div>
                <div className="relative flex-grow">
                  <pre className="code-display p-4 m-0 overflow-x-auto text-sm w-full h-full bg-[#1e1e1e]">
                    <code className={`language-${snippet.language} text-gray-100 font-mono`}>
                      {snippet.code}
                    </code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty placeholder */}
        {!isLoading && snippets.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-center text-gray-400">
            <span className="text-3xl mb-3">🖥️</span>
            <p className="text-sm font-medium">Generated code will appear here</p>
            <p className="text-xs text-gray-300 mt-1">Describe what you need and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetGenerator;
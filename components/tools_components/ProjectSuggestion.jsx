'use client';

import React, { useState } from 'react';
import { FaSync, FaTrash, FaDownload, FaCopy } from 'react-icons/fa';
import { generateProjectIdeas } from '../../lib/apiService';
import '../../app/tools_styles/projectSuggestion.scss';

const ProjectSuggestion = () => {
  const [knownLanguages, setKnownLanguages] = useState(['React', 'TypeScript', 'Node.js']);
  const [inputLanguage, setInputLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [projectType, setProjectType] = useState('Web App');
  const [targetUsers, setTargetUsers] = useState('Developers');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAddLanguage = () => {
    if (inputLanguage.trim() !== '' && !knownLanguages.includes(inputLanguage.trim())) {
      setKnownLanguages([...knownLanguages, inputLanguage.trim()]);
      setInputLanguage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddLanguage();
  };

  const handleRemoveLanguage = (lang) => {
    setKnownLanguages(knownLanguages.filter((l) => l !== lang));
  };

  const parseProjectIdeas = (text) => {
    text = text.replace(/\*\*/g, '').trim();

    const ideas = text.split('Project Idea').slice(1).map((block) => {
      const title = block.match(/:\s*(.*)/)?.[1]?.trim() || 'Untitled Project';
      const description = block.match(/A (.*)/)?.[1]?.trim() || 'No description provided.';

      const featuresBlock = block.match(/Key Features:\s*([\s\S]*?)\s*Potential Challenges:/)?.[1]?.trim() || '';
      const features = featuresBlock.split('\n').map((f) => f.replace(/^[*-]/, '').trim()).filter(Boolean);

      const challengesBlock = block.match(/Potential Challenges:\s*([\s\S]*?)\s*Tech Stack:/)?.[1]?.trim() || '';
      const challenges = challengesBlock.split('\n').map((c) => c.replace(/^[*-]/, '').trim()).filter(Boolean);

      const techStackBlock = block.match(/Tech Stack:\s*([\s\S]*)/)?.[1]?.trim() || '';
      const techStack = techStackBlock.split('\n').map((t) => t.replace(/^[*-]/, '').trim()).filter(Boolean);

      return {
        title,
        description,
        features: features.length ? features : ['Interactive dashboard', 'User authentication', 'API integration'],
        challenges: challenges.length ? challenges : ['Scalability', 'Real-time sync'],
        techStack: techStack.length ? techStack : knownLanguages,
      };
    });

    return ideas.length > 0 ? ideas : [];
  };

  const handleGenerateIdeas = async () => {
    if (!knownLanguages.length) {
      setError('Please add at least one known technology.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const data = await generateProjectIdeas({
        technologies: knownLanguages.join(', '),
        difficulty,
        projectType,
        targetUsers,
      });

      if (data && data.candidates && Array.isArray(data.candidates)) {
        const ideasText = data.candidates[0]?.content?.parts[0]?.text || '';
        if (ideasText) {
          const parsedIdeas = parseProjectIdeas(ideasText);
          setSuggestions(parsedIdeas);
        } else {
          throw new Error('Failed to extract project ideas from AI response.');
        }
      } else {
        throw new Error('Unexpected response structure from AI service.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate ideas.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportMarkdownBlueprint = (idea) => {
    const mdContent = `# Project Blueprint: ${idea.title}

## Overview
${idea.description}

## Target Audience & Difficulty
- **Target Users**: ${targetUsers}
- **Difficulty**: ${difficulty}
- **Type**: ${projectType}

## Key Features
${idea.features.map((f) => `- [ ] ${f}`).join('\n')}

## Recommended Tech Stack
${idea.techStack.map((t) => `- ${t}`).join('\n')}

## Potential Challenges & Mitigations
${idea.challenges.map((c) => `- ⚠️ ${c}`).join('\n')}

---
*Generated with CodeCraft Project Ideation Canvas*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-spec.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${idea.title} blueprint!`);
  };

  const copyBlueprint = (idea) => {
    const mdContent = `# Project Blueprint: ${idea.title}\n\n${idea.description}\n\n## Features\n${idea.features.map((f) => `- ${f}`).join('\n')}\n\n## Tech Stack\n${idea.techStack.join(', ')}`;
    navigator.clipboard.writeText(mdContent).then(() => {
      showToast('Blueprint markdown copied to clipboard!');
    });
  };

  return (
    <div className="project-suggestion">
      {/* ── LEFT: Inputs ──────────────────────────────── */}
      <div className="tool-inputs-pane">
        <div className="controls-panel">
          <div className="form-group">
            <label>Known Technologies / Skills</label>
            <div className="tech-input-row">
              <input
                type="text"
                value={inputLanguage}
                onChange={(e) => setInputLanguage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="e.g., React, TypeScript, Node.js, Python"
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                suppressHydrationWarning
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="tech-pills">
            {knownLanguages.map((lang, index) => (
              <span key={index} className="tech-pill">
                {lang}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  title="Remove technology"
                  suppressHydrationWarning
                >
                  <FaTrash size={10} />
                </button>
              </span>
            ))}
            {knownLanguages.length === 0 && (
              <span className="empty-hint">No technologies added yet.</span>
            )}
          </div>

          <div className="select-grid">
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="Web App">Web App</option>
                <option value="Mobile App">Mobile App</option>
                <option value="API Component">API Component</option>
                <option value="AI Tool">AI Tool</option>
                <option value="Script/CLI">Script / CLI</option>
                <option value="Blockchain">Blockchain</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target Users</label>
              <select
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
              >
                <option value="Developers">Developers</option>
                <option value="Students">Students</option>
                <option value="Businesses">Businesses</option>
                <option value="General Public">General Public</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateIdeas}
            disabled={isLoading || knownLanguages.length === 0}
            className="generate-btn"
            suppressHydrationWarning
          >
            {isLoading ? (
              <><FaSync className="animate-spin" /> Brainstorming Architectures...</>
            ) : (
              'Generate Project Blueprints'
            )}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Outputs ────────────────────────────── */}
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

        {isLoading && (
          <div className="empty-output">
            <FaSync className="animate-spin empty-icon" />
            <p>Analyzing tech stack &amp; generating project blueprints...</p>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="ideas-stack">
            {suggestions.map((idea, index) => (
              <div key={index} className="idea-card">
                <div className="idea-header">
                  <h3>{idea.title}</h3>
                  <div className="idea-actions">
                    <button
                      type="button"
                      onClick={() => copyBlueprint(idea)}
                      title="Copy Markdown Summary"
                      suppressHydrationWarning
                    >
                      <FaCopy /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => exportMarkdownBlueprint(idea)}
                      title="Download full project blueprint .md"
                      className="primary-action"
                      suppressHydrationWarning
                    >
                      <FaDownload /> Export Spec
                    </button>
                  </div>
                </div>

                <p className="idea-description">{idea.description}</p>

                <div className="idea-details-grid">
                  <div className="detail-column">
                    <strong>✨ Key Features</strong>
                    <ul>
                      {idea.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-column">
                    <strong>⚠️ Challenges &amp; Risks</strong>
                    <ul>
                      {idea.challenges.map((challenge, i) => (
                        <li key={i}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="stack-section">
                  <strong>Recommended Tech Stack</strong>
                  <div className="stack-tags">
                    {idea.techStack.map((tech, i) => (
                      <span key={i}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && !error && (
          <div className="empty-output">
            <span className="empty-icon">🚀</span>
            <p>Your tailored project ideas will appear here</p>
            <small>Add your known tech stack on the left and click generate</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSuggestion;

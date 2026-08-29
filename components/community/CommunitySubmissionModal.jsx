'use client';

import { useState } from 'react';
import { FiX, FiCheckCircle, FiTool, FiTerminal } from 'react-icons/fi';
import styles from './CommunitySubmissionModal.module.scss';

const DEFAULT_CATEGORIES = [
  'Development',
  'Design & UI',
  'Image & Art',
  'Video & Animation',
  'Audio & Music',
  'Writing & Content',
  'Productivity',
  'Marketing & SEO',
  'Data & Analytics',
  'Research & Science',
  'Chat & Assistants',
  'Automation',
];

const AI_MODELS = [
  'Claude 3.5 Sonnet',
  'GPT-4o',
  'GPT-4o mini',
  'Claude 3 Opus',
  'Cursor / Copilot',
  'Gemini 1.5 Pro',
  'DeepSeek V3',
  'Llama 3.3',
  'Midjourney v6',
];

const PROMPT_TYPES = ['prompt', 'trick', 'slash-command', 'technique'];
const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'Contact for pricing'];

export default function CommunitySubmissionModal({ isOpen, onClose }) {
  const [kind, setKind] = useState('tool');
  const [toolForm, setToolForm] = useState({
    tool_name: '',
    website: '',
    category: DEFAULT_CATEGORIES[0],
    description: '',
    pricing: 'Free',
    tags: '',
  });

  const [promptForm, setPromptForm] = useState({
    title: '',
    prompt_content: '',
    ai_model: AI_MODELS[0],
    category: DEFAULT_CATEGORIES[0],
    type: 'prompt',
    description: '',
    display_name: '',
    is_anonymous: false,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmitTool = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'tool', ...toolForm }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setFeedback('Thank you! Your tool suggestion has been submitted for review.');
      } else {
        setFeedback(data.error || 'Failed to submit tool suggestion.');
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'prompt', ...promptForm }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setFeedback('Thank you! Your AI prompt has been submitted for review.');
      } else {
        setFeedback(data.error || 'Failed to submit prompt.');
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setFeedback(null);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleResetAndClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Submit to CodeCraft</h2>
          <button
            type="button"
            onClick={handleResetAndClose}
            className={styles.closeBtn}
            aria-label="Close"
            suppressHydrationWarning
          >
            <FiX />
          </button>
        </div>

        {isSuccess ? (
          <div className={styles.successView}>
            <div className={styles.successIconBox}>
              <FiCheckCircle />
            </div>
            <h3>Submission Received!</h3>
            <p>{feedback}</p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className={styles.primaryBtn}
              suppressHydrationWarning
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={styles.kindSelector}>
              <button
                type="button"
                className={`${styles.kindBtn} ${kind === 'tool' ? styles.active : ''}`}
                onClick={() => { setKind('tool'); setFeedback(null); }}
                suppressHydrationWarning
              >
                <FiTool /> AI Tool
              </button>
              <button
                type="button"
                className={`${styles.kindBtn} ${kind === 'prompt' ? styles.active : ''}`}
                onClick={() => { setKind('prompt'); setFeedback(null); }}
                suppressHydrationWarning
              >
                <FiTerminal /> AI Prompt / Trick
              </button>
            </div>

            {feedback && <div className={styles.errorAlert}>{feedback}</div>}

            {kind === 'tool' ? (
              <form onSubmit={handleSubmitTool} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Tool Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cursor, v0, Bolt"
                    value={toolForm.tool_name}
                    onChange={(e) => setToolForm({ ...toolForm, tool_name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Website URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={toolForm.website}
                    onChange={(e) => setToolForm({ ...toolForm, website: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <select
                      value={toolForm.category}
                      onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Pricing Model</label>
                    <select
                      value={toolForm.pricing}
                      onChange={(e) => setToolForm({ ...toolForm, pricing: e.target.value })}
                    >
                      {PRICING_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Short Description *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Describe what this tool does and who it is for..."
                    value={toolForm.description}
                    onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="coding, assistant, productivity"
                    value={toolForm.tags}
                    onChange={(e) => setToolForm({ ...toolForm, tags: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.primaryBtn}
                  suppressHydrationWarning
                >
                  {loading ? 'Submitting...' : 'Submit AI Tool'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitPrompt} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Prompt Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js 16 Component Scaffold"
                    value={promptForm.title}
                    onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Target AI Model</label>
                    <select
                      value={promptForm.ai_model}
                      onChange={(e) => setPromptForm({ ...promptForm, ai_model: e.target.value })}
                    >
                      {AI_MODELS.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Content Type</label>
                    <select
                      value={promptForm.type}
                      onChange={(e) => setPromptForm({ ...promptForm, type: e.target.value })}
                    >
                      {PROMPT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Prompt Content *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Paste your prompt text here... You can use {{variables}} for placeholders."
                    value={promptForm.prompt_content}
                    onChange={(e) => setPromptForm({ ...promptForm, prompt_content: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description / Usage Note</label>
                  <textarea
                    rows="2"
                    placeholder="How to use this prompt and expected output..."
                    value={promptForm.description}
                    onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Display Name (optional)</label>
                  <input
                    type="text"
                    placeholder="Your name or handle"
                    value={promptForm.display_name}
                    onChange={(e) => setPromptForm({ ...promptForm, display_name: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.primaryBtn}
                  suppressHydrationWarning
                >
                  {loading ? 'Submitting...' : 'Submit AI Prompt'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}


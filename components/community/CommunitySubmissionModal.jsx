'use client';

import { useState, useRef } from 'react';
import { FiX, FiCheckCircle, FiTool, FiTerminal } from 'react-icons/fi';
import DEFAULT_CATEGORIES from '../../data/categories.json';
import { ALLOWED_PRICING } from '../../lib/canonical-tool-schema';
import styles from './CommunitySubmissionModal.module.scss';

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

export default function CommunitySubmissionModal({ isOpen, onClose }) {
  const [kind, setKind] = useState('tool');
  const [toolForm, setToolForm] = useState({
    name: '',
    website: '',
    category: DEFAULT_CATEGORIES[0]?.slug || '',
    subCategory: '',
    description: '',
    fullOverview: '',
    keyFeatures: '',
    pros: '',
    cons: '',
    pricingModel: 'Free',
    platforms: 'Web',
    tags: '',
    useCases: '',
    bestFor: '',
  });

  const [promptForm, setPromptForm] = useState({
    title: '',
    prompt_content: '',
    ai_model: AI_MODELS[0],
    category: DEFAULT_CATEGORIES[0]?.slug || 'ai-assistants',
    type: 'prompt',
    use_case: '',
    description: '',
    display_name: '',
    is_anonymous: false,
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const toolSubmitInFlight = useRef(false);
  const toolSubmissionKey = useRef(null);

  if (!isOpen) return null;

  const updateToolForm = (field, value) => {
    toolSubmissionKey.current = null;
    setToolForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmitTool = async (e) => {
    e.preventDefault();
    if (toolSubmitInFlight.current) return;
    toolSubmitInFlight.current = true;
    setLoading(true);
    setFeedback(null);

    try {
      const idempotencyKey = toolSubmissionKey.current || window.crypto.randomUUID();
      toolSubmissionKey.current = idempotencyKey;
      const res = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'tool',
          idempotencyKey,
          ...toolForm,
          keyFeatures: splitLines(toolForm.keyFeatures),
          pros: splitLines(toolForm.pros),
          cons: splitLines(toolForm.cons),
          platforms: splitLines(toolForm.platforms),
          tags: toolForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          useCases: splitLines(toolForm.useCases),
          bestFor: splitLines(toolForm.bestFor),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toolSubmissionKey.current = null;
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
      toolSubmitInFlight.current = false;
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
          <h2>Submit to CodeCanvas</h2>
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
                    value={toolForm.name}
                    onChange={(e) => updateToolForm('name', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Website URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={toolForm.website}
                    onChange={(e) => updateToolForm('website', e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Category *</label>
                    <select
                      required
                      value={toolForm.category}
                      onChange={(e) => updateToolForm('category', e.target.value)}
                    >
                      {DEFAULT_CATEGORIES.map((category) => (
                        <option key={category.slug} value={category.slug}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Pricing Model *</label>
                    <select
                      required
                      value={toolForm.pricingModel}
                      onChange={(e) => updateToolForm('pricingModel', e.target.value)}
                    >
                      {ALLOWED_PRICING.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Introduction / Short Description *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Describe what this tool does and who it is for..."
                    value={toolForm.description}
                    onChange={(e) => updateToolForm('description', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Full Overview *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Describe the tool and its capabilities..."
                    value={toolForm.fullOverview}
                    onChange={(e) => updateToolForm('fullOverview', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Subcategory</label>
                  <input
                    value={toolForm.subCategory}
                    onChange={(e) => updateToolForm('subCategory', e.target.value)}
                    placeholder="e.g. Coding Assistants"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Key Features (one per line)</label>
                  <textarea
                    rows="3"
                    value={toolForm.keyFeatures}
                    onChange={(e) => updateToolForm('keyFeatures', e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Pros (one per line)</label>
                    <textarea
                      rows="3"
                      value={toolForm.pros}
                      onChange={(e) => updateToolForm('pros', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cons (one per line)</label>
                    <textarea
                      rows="3"
                      value={toolForm.cons}
                      onChange={(e) => updateToolForm('cons', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Platforms (one per line)</label>
                  <textarea
                    rows="2"
                    value={toolForm.platforms}
                    onChange={(e) => updateToolForm('platforms', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="coding, assistant, productivity"
                    value={toolForm.tags}
                    onChange={(e) => updateToolForm('tags', e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Use Cases (one per line)</label>
                    <textarea
                      rows="3"
                      value={toolForm.useCases}
                      onChange={(e) => updateToolForm('useCases', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Best For (one per line)</label>
                    <textarea
                      rows="3"
                      value={toolForm.bestFor}
                      onChange={(e) => updateToolForm('bestFor', e.target.value)}
                    />
                  </div>
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

function splitLines(value) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

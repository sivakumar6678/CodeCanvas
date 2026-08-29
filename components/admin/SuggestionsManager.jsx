'use client';

import { useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiExternalLink, FiEye, FiX } from 'react-icons/fi';
import styles from './SuggestionsManager.module.scss';
import { ALLOWED_PRICING } from '../../lib/tool-json-validation';

const emptyReview = {
  type: 'tool',
  id: '',
  tool_name: '',
  website_url: '',
  category: '',
  subcategory: '',
  description: '',
  pricing: 'Free',
  pricingModel: 'Free',
  tags: '',
  recommendation_reason: '',
  title: '',
  prompt_content: '',
  ai_model: '',
  use_case: '',
  display_name: '',
  is_anonymous: false,
  admin_notes: '',
};

export default function SuggestionsManager() {
  const [status, setStatus] = useState('pending');
  const [type, setType] = useState('all');
  const [items, setItems] = useState({ toolSuggestions: [], promptSubmissions: [] });
  const [categories, setCategories] = useState([]);
  const [review, setReview] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [status, type]);

  async function load() {
    try {
      setLoadError('');
      const query = new URLSearchParams({ status });
      if (type !== 'all') query.set('type', type);
      const response = await fetch(`/api/admin/suggestions?${query}`);
      if (!response.ok) throw new Error('Failed to load suggestions');
      const data = await response.json();
      
      if (data.missingConfig) {
        setLoadError('Supabase service-role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local to enable reviewing database suggestions.');
      }

      setItems({
        toolSuggestions: data.toolSuggestions || [],
        promptSubmissions: data.promptSubmissions || []
      });
      if (data.categories && data.categories.length) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setLoadError('Failed to load suggestions. Please check server configuration.');
      setItems({ toolSuggestions: [], promptSubmissions: [] });
    }
  }

  function open(item, itemType) {
    setReview({
      ...emptyReview,
      ...item,
      type: itemType,
      typeName: item.type || 'prompt',
      id: item.id,
      pricingModel: item.pricing || item.pricingModel || 'Free',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
    });
  }

  async function act(action, target = review) {
    if (!target) return;
    setSubmitting(true);
    setFeedback('');

    const data = target.type === 'tool'
      ? {
          tool_name: target.tool_name,
          website_url: target.website_url,
          category: target.category,
          subcategory: target.subcategory || target.subCategory || '',
          description: target.description,
          pricing: target.pricingModel || target.pricing || 'Free',
          pricingModel: target.pricingModel || target.pricing || 'Free',
          tags: typeof target.tags === 'string'
            ? target.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : target.tags || [],
          recommendation_reason: target.recommendation_reason || target.fullOverview || '',
          display_name: target.display_name,
          is_anonymous: target.is_anonymous,
          admin_notes: target.admin_notes || ''
        }
      : {
          title: target.title,
          type: target.typeName || target.contentType || 'prompt',
          prompt_content: target.prompt_content,
          ai_model: target.ai_model,
          category: target.category,
          use_case: target.use_case,
          use_cases: target.use_cases || [],
          tags: typeof target.tags === 'string'
            ? target.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : target.tags || [],
          description: target.description,
          display_name: target.display_name,
          is_anonymous: target.is_anonymous,
          admin_notes: target.admin_notes || ''
        };

    try {
      const response = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: target.type, id: target.id, action, data })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(payload.error || 'Unable to update submission.');
        setSubmitting(false);
        return;
      }

      setFeedback(
        action === 'reject'
          ? 'Submission rejected.'
          : action === 'edit'
          ? 'Submission updated.'
          : 'Submission approved and published.'
      );
      setReview(null);
      await load();
    } catch (error) {
      console.error('Action error:', error);
      setFeedback('Failed to perform action. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = [
    ...(type === 'prompt' ? [] : items.toolSuggestions.map((item) => ({ item, itemType: 'tool' }))),
    ...(type === 'tool' ? [] : items.promptSubmissions.map((item) => ({ item, itemType: 'prompt' })))
  ];

  const totalCount = (items.toolSuggestions?.length || 0) + (items.promptSubmissions?.length || 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Review queue</p>
          <h1>Suggestions</h1>
          <p>Review contributions before they enter the public catalog.</p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.tabGroup}>
          {['pending', 'approved', 'rejected'].map((tabStatus) => (
            <button
              key={tabStatus}
              type="button"
              className={status === tabStatus ? styles.active : ''}
              onClick={() => setStatus(tabStatus)}
            >
              {tabStatus}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          {[
            ['all', 'All content'],
            ['tool', 'Tools'],
            ['prompt', 'Prompts']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={type === value ? styles.active : ''}
              onClick={() => setType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={feedback.includes('Unable') || feedback.includes('Failed') ? styles.errorAlert : styles.feedback}>
          {feedback}
        </div>
      )}

      {loadError && <div className={styles.errorAlert}>{loadError}</div>}

      <div className={styles.list}>
        {rows.length > 0 ? (
          rows.map(({ item, itemType }) => (
            <article key={`${itemType}-${item.id}`} className={styles.row}>
              <div className={styles.content}>
                <div className={styles.badges}>
                  <span className={styles.typeBadge}>
                    {itemType === 'tool' ? 'AI Tool' : (item.type || 'Prompt')}
                  </span>
                  <span className={styles.categoryBadge}>{item.category}</span>
                  {item.pricing && <span className={styles.pricingBadge}>{item.pricing}</span>}
                  {item.ai_model && <span className={styles.modelBadge}>{item.ai_model}</span>}
                </div>

                <h2>{itemType === 'tool' ? item.tool_name : item.title}</h2>
                <p className={styles.descriptionText}>{item.description}</p>

                {itemType === 'tool' && item.website_url && (
                  <a
                    href={item.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {item.website_url} <FiExternalLink />
                  </a>
                )}

                {itemType === 'prompt' && item.prompt_content && (
                  <pre className={styles.promptSnippet}>
                    {item.prompt_content.slice(0, 180)}
                    {item.prompt_content.length > 180 ? '...' : ''}
                  </pre>
                )}

                <div className={styles.metaRow}>
                  <small>Submitted by {item.is_anonymous ? 'Anonymous contributor' : (item.display_name || 'Community user')}</small>
                  {item.created_at && (
                    <small> • {new Date(item.created_at).toLocaleDateString()}</small>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  title="View"
                  onClick={() => open(item, itemType)}
                >
                  <FiEye />
                </button>
                <button
                  type="button"
                  title="Edit"
                  onClick={() => open(item, itemType)}
                >
                  <FiEdit2 />
                </button>
                {status === 'pending' && (
                  <>
                    <button
                      type="button"
                      title="Approve"
                      className={styles.approveBtn}
                      onClick={() => act('approve', { ...emptyReview, ...item, type: itemType, id: item.id, typeName: item.type, tags: (item.tags || []).join(', ') })}
                    >
                      <FiCheck />
                    </button>
                    <button
                      type="button"
                      title="Reject"
                      className={styles.rejectBtn}
                      onClick={() => act('reject', { ...emptyReview, ...item, type: itemType, id: item.id, typeName: item.type, tags: (item.tags || []).join(', ') })}
                    >
                      <FiX />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <p>No {status} {type === 'all' ? 'submissions' : `${type}s`} found in this view.</p>
          </div>
        )}
      </div>

      {review && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{review.type === 'tool' ? `Review Tool: ${review.tool_name}` : `Review Prompt: ${review.title}`}</h2>
                <p className={styles.modalSub}>
                  {status === 'pending' ? 'Edit submission details before approval or rejection.' : 'View submission details.'}
                </p>
              </div>
              <button type="button" onClick={() => setReview(null)} className={styles.closeBtn}>
                <FiX />
              </button>
            </div>

            <div className={styles.form}>
              {review.type === 'tool' ? (
                <>
                  <label>
                    Tool Name
                    <input
                      value={review.tool_name || ''}
                      onChange={(e) => setReview({ ...review, tool_name: e.target.value })}
                    />
                  </label>

                  <label>
                    Website URL
                    <input
                      value={review.website_url || ''}
                      onChange={(e) => setReview({ ...review, website_url: e.target.value })}
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={review.category || ''}
                      onChange={(e) => setReview({ ...review, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.name} ({cat.slug})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Subcategory
                    <input
                      value={review.subcategory || ''}
                      onChange={(e) => setReview({ ...review, subcategory: e.target.value })}
                      placeholder="e.g. code-editor, generator"
                    />
                  </label>

                  <label>
                    Pricing Model
                    <select
                      value={review.pricingModel || review.pricing || 'Free'}
                      onChange={(e) => setReview({ ...review, pricingModel: e.target.value, pricing: e.target.value })}
                    >
                      {ALLOWED_PRICING.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Tags (comma separated)
                    <input
                      value={review.tags || ''}
                      onChange={(e) => setReview({ ...review, tags: e.target.value })}
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Short Description
                    <textarea
                      value={review.description || ''}
                      onChange={(e) => setReview({ ...review, description: e.target.value })}
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Why Recommended / Full Overview
                    <textarea
                      value={review.recommendation_reason || ''}
                      onChange={(e) => setReview({ ...review, recommendation_reason: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Title
                    <input
                      value={review.title || ''}
                      onChange={(e) => setReview({ ...review, title: e.target.value })}
                    />
                  </label>

                  <label>
                    Content Type
                    <select
                      value={review.typeName || review.contentType || 'prompt'}
                      onChange={(e) => setReview({ ...review, typeName: e.target.value })}
                    >
                      <option value="prompt">Prompt</option>
                      <option value="trick">Trick</option>
                      <option value="slash-command">Slash command</option>
                      <option value="technique">Technique</option>
                    </select>
                  </label>

                  <label>
                    Target AI / Model
                    <input
                      value={review.ai_model || ''}
                      onChange={(e) => setReview({ ...review, ai_model: e.target.value })}
                      placeholder="e.g. Claude 3.5, GPT-4o, Cursor"
                    />
                  </label>

                  <label>
                    Category
                    <input
                      value={review.category || ''}
                      onChange={(e) => setReview({ ...review, category: e.target.value })}
                      placeholder="e.g. coding, refactoring, writing"
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Description
                    <textarea
                      value={review.description || ''}
                      onChange={(e) => setReview({ ...review, description: e.target.value })}
                    />
                  </label>

                  <label className={styles.fullWidth}>
                    Prompt / Instruction Content
                    <textarea
                      value={review.prompt_content || ''}
                      onChange={(e) => setReview({ ...review, prompt_content: e.target.value })}
                      rows={6}
                    />
                  </label>
                </>
              )}

              <label className={styles.fullWidth}>
                Admin Notes
                <textarea
                  value={review.admin_notes || ''}
                  onChange={(e) => setReview({ ...review, admin_notes: e.target.value })}
                  placeholder="Internal notes for this review decision..."
                />
              </label>
            </div>

            <footer>
              <button type="button" onClick={() => setReview(null)} disabled={submitting}>
                Close
              </button>
              {status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => act('reject')}
                    disabled={submitting}
                    className={styles.rejectAction}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => act('edit')}
                    disabled={submitting}
                  >
                    Save Edit
                  </button>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => act('edit-and-approve')}
                    disabled={submitting}
                  >
                    {submitting ? 'Publishing...' : 'Edit & Approve'}
                  </button>
                </>
              )}
              {status !== 'pending' && (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => act('edit')}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
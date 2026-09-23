'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  FiCheck,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiX,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTrash2,
  FiLayers,
} from 'react-icons/fi';
import styles from './SuggestionsManager.module.scss';
import { ALLOWED_PRICING } from '../../lib/tool-json-validation';
import { CONTRIBUTION_TYPE_LABELS } from '../../lib/contribution-validation';

const emptyReview = {
  type: 'tool',
  id: '',
  tool_name: '',
  website_url: '',
  category: '',
  subcategory: '',
  description: '',
  pricing: 'Freemium',
  pricingModel: 'Freemium',
  tags: '',
  recommendation_reason: '',
  title: '',
  typeName: 'prompt',
  prompt_content: '',
  ai_model: 'Universal',
  platform: 'Universal',
  use_case: '',
  display_name: '',
  is_anonymous: false,
  admin_notes: '',
};

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Content' },
  { value: 'tool', label: 'AI Tools' },
  { value: 'prompt', label: 'Prompts' },
  { value: 'trick', label: 'Tricks' },
  { value: 'shortcut', label: 'Shortcuts / Commands' },
  { value: 'technique', label: 'Techniques' },
  { value: 'guide', label: 'Guides & Tips' },
];

export default function ContributionsManager() {
  const [status, setStatus] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState({ toolSuggestions: [], promptSubmissions: [] });
  const [categories, setCategories] = useState([]);
  const [review, setReview] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [status, typeFilter]);

  async function load() {
    setLoading(true);
    try {
      setLoadError('');
      const query = new URLSearchParams({ status });
      if (typeFilter !== 'all') query.set('type', typeFilter);
      if (searchQuery.trim()) query.set('q', searchQuery.trim());

      const response = await fetch(`/api/admin/suggestions?${query}`);
      if (!response.ok) throw new Error('Failed to load contributions');
      const data = await response.json();

      setItems({
        toolSuggestions: data.toolSuggestions || [],
        promptSubmissions: data.promptSubmissions || [],
      });
      if (data.categories && data.categories.length) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading contributions:', error);
      setLoadError('Failed to load contributions from server.');
      setItems({ toolSuggestions: [], promptSubmissions: [] });
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    load();
  }

  function openModal(item, itemType) {
    setReview({
      ...emptyReview,
      ...item,
      type: itemType,
      typeName: item.type || 'prompt',
      id: item.id,
      pricingModel: item.pricing || item.pricingModel || 'Freemium',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      admin_notes: item.admin_notes || '',
    });
  }

  async function act(action, target = review) {
    if (!target) return;
    setSubmitting(true);
    setFeedback('');

    const isTool = target.type === 'tool';
    const payloadData = isTool
      ? {
          tool_name: target.tool_name,
          website_url: target.website_url,
          category: target.category,
          subcategory: target.subcategory || target.subCategory || '',
          description: target.description,
          pricing: target.pricingModel || target.pricing || 'Freemium',
          pricingModel: target.pricingModel || target.pricing || 'Freemium',
          tags: typeof target.tags === 'string'
            ? target.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : target.tags || [],
          recommendation_reason: target.recommendation_reason || target.fullOverview || '',
          display_name: target.display_name,
          is_anonymous: target.is_anonymous,
          admin_notes: target.admin_notes || '',
        }
      : {
          title: target.title,
          type: target.typeName || target.type || 'prompt',
          prompt_content: target.prompt_content,
          ai_model: target.ai_model || 'Universal',
          platform: target.platform || target.ai_model || 'Universal',
          category: target.category,
          use_case: target.use_case,
          use_cases: target.use_cases || [],
          tags: typeof target.tags === 'string'
            ? target.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : target.tags || [],
          description: target.description,
          display_name: target.display_name,
          is_anonymous: target.is_anonymous,
          admin_notes: target.admin_notes || '',
        };

    try {
      const response = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: target.type, id: target.id, action, data: payloadData }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(payload.error || 'Unable to complete action.');
        setSubmitting(false);
        return;
      }

      setFeedback(
        action === 'reject'
          ? 'Submission marked as rejected.'
          : action === 'delete'
            ? 'Submission removed.'
            : action === 'edit'
              ? 'Submission updated successfully.'
              : action === 'publish'
                ? 'Submission approved and published to live catalog!'
                : 'Submission approved successfully!'
      );
      setReview(null);
      await load();
    } catch (error) {
      console.error('Action error:', error);
      setFeedback('Failed to perform moderation action. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const rows = [
    ...(typeFilter === 'prompt' || ['trick', 'shortcut', 'technique', 'guide'].includes(typeFilter)
      ? []
      : items.toolSuggestions.map((item) => ({ item, itemType: 'tool' }))),
    ...(typeFilter === 'tool'
      ? []
      : items.promptSubmissions.map((item) => ({ item, itemType: 'prompt' }))),
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Studio Moderation</p>
          <h1>Contributions Management</h1>
          <p>Review, edit, approve, or reject user-contributed tools, prompts, tricks, and guides.</p>
        </div>
      </header>

      {/* Control Bar: Status Tabs, Search, and Type Filter */}
      <div className={styles.controls}>
        <div className={styles.tabGroup}>
          {['pending', 'approved', 'rejected', 'all'].map((tabStatus) => (
            <button
              key={tabStatus}
              type="button"
              className={status === tabStatus ? styles.active : ''}
              onClick={() => setStatus(tabStatus)}
            >
              {tabStatus.charAt(0).toUpperCase() + tabStatus.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.filterBar}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search contributions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </form>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.typeSelect}
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={feedback.includes('Unable') || feedback.includes('Failed') ? styles.errorAlert : styles.feedback}>
          {feedback}
        </div>
      )}

      {loadError && <div className={styles.errorAlert}>{loadError}</div>}

      {/* Review Queue List */}
      <div className={styles.list}>
        {rows.length > 0 ? (
          rows.map(({ item, itemType }) => {
            const isTool = itemType === 'tool';
            const typeLabel = isTool
              ? 'AI Tool'
              : CONTRIBUTION_TYPE_LABELS[item.type] || item.type || 'Knowledge';

            return (
              <article key={`${itemType}-${item.id}`} className={styles.row}>
                <div className={styles.content}>
                  <div className={styles.badges}>
                    <span className={styles.typeBadge}>{typeLabel}</span>
                    <span className={styles.categoryBadge}>{item.category}</span>
                    {item.pricing && <span className={styles.pricingBadge}>{item.pricing}</span>}
                    {item.ai_model && <span className={styles.modelBadge}>{item.ai_model}</span>}
                    <span
                      className={`${styles.statusBadge} ${
                        item.status === 'approved'
                          ? styles.statusApproved
                          : item.status === 'rejected'
                            ? styles.statusRejected
                            : styles.statusPending
                      }`}
                    >
                      {item.status === 'approved' ? (
                        <><FiCheckCircle /> Approved</>
                      ) : item.status === 'rejected' ? (
                        <><FiAlertCircle /> Rejected</>
                      ) : (
                        <><FiClock /> Pending</>
                      )}
                    </span>
                  </div>

                  <h2>{isTool ? item.tool_name : item.title}</h2>
                  <p className={styles.descriptionText}>{item.description}</p>

                  {isTool && item.website_url && (
                    <a
                      href={item.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      {item.website_url} <FiExternalLink />
                    </a>
                  )}

                  {!isTool && item.prompt_content && (
                    <pre className={styles.promptSnippet}>
                      {item.prompt_content.slice(0, 180)}
                      {item.prompt_content.length > 180 ? '...' : ''}
                    </pre>
                  )}

                  {item.admin_notes && (
                    <div className={styles.adminNotePreview}>
                      <strong>Admin note:</strong> {item.admin_notes}
                    </div>
                  )}

                  <div className={styles.metaRow}>
                    <small>
                      Submitted by {item.is_anonymous ? 'Anonymous contributor' : item.display_name || 'Community user'}
                    </small>
                    {item.created_at && (
                      <small> &bull; {new Date(item.created_at).toLocaleDateString()}</small>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    title="Inspect Details"
                    onClick={() => openModal(item, itemType)}
                    className={styles.actionBtn}
                  >
                    <FiEye /> View
                  </button>
                  <button
                    type="button"
                    title="Edit Submission"
                    onClick={() => openModal(item, itemType)}
                    className={styles.actionBtn}
                  >
                    <FiEdit2 /> Edit
                  </button>

                  {item.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        title="Approve"
                        className={styles.approveBtn}
                        onClick={() =>
                          act('approve', {
                            ...emptyReview,
                            ...item,
                            type: itemType,
                            id: item.id,
                            typeName: item.type,
                            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                          })
                        }
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        type="button"
                        title="Approve & Publish to Catalog"
                        className={styles.publishBtn}
                        onClick={() =>
                          act('publish', {
                            ...emptyReview,
                            ...item,
                            type: itemType,
                            id: item.id,
                            typeName: item.type,
                            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                          })
                        }
                      >
                        <FiExternalLink /> Publish
                      </button>
                      <button
                        type="button"
                        title="Reject"
                        className={styles.rejectBtn}
                        onClick={() =>
                          act('reject', {
                            ...emptyReview,
                            ...item,
                            type: itemType,
                            id: item.id,
                            typeName: item.type,
                            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                          })
                        }
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}

                  {item.status === 'approved' && (
                    <>
                      {isTool && item.published_slug ? (
                        <a
                          href={`/ai-tools/tool/${item.published_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.viewLiveBtn}
                          title="View in Live Catalog"
                        >
                          <FiExternalLink /> Live in Catalog
                        </a>
                      ) : !isTool && item.published_id ? (
                        <a
                          href={`/ai-knowledge/${item.published_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.viewLiveBtn}
                          title="View in Live Knowledge Base"
                        >
                          <FiExternalLink /> Live in Knowledge
                        </a>
                      ) : (
                        <button
                          type="button"
                          title="Publish to Live Catalog"
                          className={styles.publishBtn}
                          onClick={() =>
                            act('publish', {
                              ...emptyReview,
                              ...item,
                              type: itemType,
                              id: item.id,
                              typeName: item.type,
                              tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
                            })
                          }
                        >
                          <FiExternalLink /> Publish
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        ) : loading ? (
          <div className={styles.empty}>
            <FiLayers className={styles.emptyIcon} />
            <p>Loading contributions...</p>
          </div>
        ) : (
          <div className={styles.empty}>
            <FiLayers className={styles.emptyIcon} />
            <p>No {status} contributions found matching this filter.</p>
          </div>
        )}
      </div>

      {/* Review & Moderation Modal */}
      {review && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h2>
                  {review.type === 'tool'
                    ? `Review Tool: ${review.tool_name}`
                    : `Review ${CONTRIBUTION_TYPE_LABELS[review.typeName] || 'Item'}: ${review.title}`}
                </h2>
                <p className={styles.modalSub}>
                  Edit submission metadata, add moderation feedback, and approve or reject.
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
                    />
                  </label>

                  <label>
                    Pricing Model
                    <select
                      value={review.pricingModel || 'Freemium'}
                      onChange={(e) => setReview({ ...review, pricingModel: e.target.value })}
                    >
                      {ALLOWED_PRICING.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Tags (comma-separated)
                    <input
                      value={review.tags || ''}
                      onChange={(e) => setReview({ ...review, tags: e.target.value })}
                    />
                  </label>

                  <label className={styles.wideField}>
                    Description
                    <textarea
                      rows={3}
                      value={review.description || ''}
                      onChange={(e) => setReview({ ...review, description: e.target.value })}
                    />
                  </label>

                  <label className={styles.wideField}>
                    Recommendation Reason / Overview
                    <textarea
                      rows={4}
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
                      value={review.typeName || 'prompt'}
                      onChange={(e) => setReview({ ...review, typeName: e.target.value })}
                    >
                      <option value="prompt">Prompt</option>
                      <option value="trick">Trick</option>
                      <option value="shortcut">Shortcut / Slash Command</option>
                      <option value="technique">Technique</option>
                      <option value="guide">Guide / Tip</option>
                    </select>
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
                    AI Model / Platform
                    <input
                      value={review.ai_model || review.platform || 'Universal'}
                      onChange={(e) =>
                        setReview({ ...review, ai_model: e.target.value, platform: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Primary Use Case
                    <input
                      value={review.use_case || ''}
                      onChange={(e) => setReview({ ...review, use_case: e.target.value })}
                    />
                  </label>

                  <label>
                    Tags (comma-separated)
                    <input
                      value={review.tags || ''}
                      onChange={(e) => setReview({ ...review, tags: e.target.value })}
                    />
                  </label>

                  <label className={styles.wideField}>
                    Description
                    <textarea
                      rows={3}
                      value={review.description || ''}
                      onChange={(e) => setReview({ ...review, description: e.target.value })}
                    />
                  </label>

                  <label className={styles.wideField}>
                    Content / Prompt Template
                    <textarea
                      rows={6}
                      value={review.prompt_content || ''}
                      onChange={(e) => setReview({ ...review, prompt_content: e.target.value })}
                    />
                  </label>
                </>
              )}

              {/* Admin Moderation Notes */}
              <label className={styles.wideField}>
                <strong>Admin Feedback / Moderation Note (visible to user if rejected)</strong>
                <textarea
                  rows={2}
                  placeholder="Optional note for the contributor or reason for rejection..."
                  value={review.admin_notes || ''}
                  onChange={(e) => setReview({ ...review, admin_notes: e.target.value })}
                />
              </label>
            </div>

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.rejectModalBtn}
                onClick={() => act('reject')}
                disabled={submitting}
              >
                <FiX /> Reject Submission
              </button>

              <div className={styles.modalPrimaryActions}>
                <button
                  type="button"
                  className={styles.saveModalBtn}
                  onClick={() => act('edit')}
                  disabled={submitting}
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  className={styles.approveModalBtn}
                  onClick={() => act('approve')}
                  disabled={submitting}
                >
                  <FiCheck /> Approve
                </button>

                <button
                  type="button"
                  className={styles.publishModalBtn}
                  onClick={() => act('publish')}
                  disabled={submitting}
                >
                  <FiExternalLink /> Approve &amp; Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiCheck,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiExternalLink,
  FiLayers,
  FiSliders,
} from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import { CONTRIBUTION_TYPE_LABELS } from '../../lib/contribution-validation';
import styles from './ContributionForms.module.scss';

const KNOWLEDGE_TYPE_OPTIONS = [
  { id: 'prompt', label: 'Prompt', desc: 'System & role templates' },
  { id: 'trick', label: 'Trick', desc: 'Non-obvious steerage & hacks' },
  { id: 'shortcut', label: 'Shortcut / Command', desc: 'IDE & CLI slash commands' },
  { id: 'technique', label: 'Technique', desc: 'Reasoning & prompting patterns' },
  { id: 'guide', label: 'Guide / Tip', desc: 'Actionable workflow recipes' },
];

const initialTool = {
  tool_name: '',
  website_url: '',
  category: '',
  subcategory: '',
  description: '',
  pricing: 'Freemium',
  platforms: 'Web',
  tags: '',
  recommendation_reason: '',
  display_name: '',
  is_anonymous: false,
};

const initialKnowledge = {
  title: '',
  type: 'prompt',
  prompt_content: '',
  ai_model: 'Universal',
  platform: 'Universal',
  category: '',
  use_case: '',
  tags: '',
  description: '',
  display_name: '',
  is_anonymous: false,
};

export default function ContributionForms({ categories = [] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'status'
  const [kind, setKind] = useState('tool'); // 'tool' | 'knowledge'
  const [knowledgeType, setKnowledgeType] = useState('prompt');

  const [toolData, setToolData] = useState(initialTool);
  const [knowledgeData, setKnowledgeData] = useState(initialKnowledge);
  const [statusFilter, setStatusFilter] = useState('all');

  const [user, setUser] = useState(null);
  const [mySubmissions, setMySubmissions] = useState({ tools: [], prompts: [] });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [state, setState] = useState({ loading: false, error: '', success: '' });
  const [actionFeedback, setActionFeedback] = useState('');

  // Load user session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        const name = data.user.user_metadata?.username || data.user.email?.split('@')[0] || '';
        setToolData((prev) => ({ ...prev, display_name: prev.display_name || name }));
        setKnowledgeData((prev) => ({ ...prev, display_name: prev.display_name || name }));
      }
    });
  }, [supabase]);

  // Load user submissions when status tab is selected
  useEffect(() => {
    if (activeTab === 'status' && user) {
      loadMySubmissions();
    }
  }, [activeTab, user]);

  async function loadMySubmissions() {
    setLoadingSubmissions(true);
    try {
      const [toolsRes, promptsRes] = await Promise.all([
        fetch('/api/contributions/tools'),
        fetch('/api/contributions/prompts'),
      ]);

      const tools = toolsRes.ok ? await toolsRes.json() : [];
      const prompts = promptsRes.ok ? await promptsRes.json() : [];

      setMySubmissions({
        tools: Array.isArray(tools) ? tools : [],
        prompts: Array.isArray(prompts) ? prompts : [],
      });
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  const updateTool = (field, value) => setToolData((prev) => ({ ...prev, [field]: value }));
  const updateKnowledge = (field, value) => setKnowledgeData((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: '', success: '' });

    if (!user) {
      router.push('/login?next=/contribute');
      return;
    }

    const endpoint = kind === 'tool' ? '/api/contributions/tools' : '/api/contributions/prompts';
    const payload = kind === 'tool'
      ? toolData
      : { ...knowledgeData, type: knowledgeType };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push('/login?next=/contribute');
        return;
      }

      if (!res.ok) {
        setState({ loading: false, error: data.error || 'Failed to submit.', success: '' });
        return;
      }

      setState({
        loading: false,
        error: '',
        success: 'Submitted for review! Our moderation team will review your contribution shortly.',
      });

      if (kind === 'tool') {
        setToolData(initialTool);
      } else {
        setKnowledgeData(initialKnowledge);
      }

      loadMySubmissions();
    } catch (err) {
      setState({ loading: false, error: 'Network error. Please try again.', success: '' });
    }
  }

  async function handleWithdraw(submissionId, submissionKind) {
    if (!confirm('Are you sure you want to withdraw this pending submission?')) return;
    setActionFeedback('');

    const endpoint = submissionKind === 'tool'
      ? `/api/contributions/tools?id=${submissionId}`
      : `/api/contributions/prompts?id=${submissionId}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setActionFeedback('Submission withdrawn successfully.');
        loadMySubmissions();
        setTimeout(() => setActionFeedback(''), 3000);
      } else {
        const err = await res.json();
        setActionFeedback(err.error || 'Unable to withdraw submission.');
      }
    } catch (e) {
      setActionFeedback('Failed to withdraw submission.');
    }
  }

  const allSubmissions = [
    ...(mySubmissions.tools || []).map((t) => ({ ...t, kind: 'tool' })),
    ...(mySubmissions.prompts || []).map((p) => ({ ...p, kind: 'knowledge' })),
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const filteredSubmissions = allSubmissions.filter((sub) => {
    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  });

  const totalCount = allSubmissions.length;
  const pendingCount = allSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <section className={styles.workspace}>
      {/* Top Main Navigation Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          className={activeTab === 'submit' ? styles.activeTab : ''}
          onClick={() => setActiveTab('submit')}
          role="tab"
          aria-selected={activeTab === 'submit'}
        >
          <FiSend aria-hidden="true" /> Submit Contribution
        </button>
        <button
          type="button"
          className={activeTab === 'status' ? styles.activeTab : ''}
          onClick={() => setActiveTab('status')}
          role="tab"
          aria-selected={activeTab === 'status'}
        >
          <FiClock aria-hidden="true" /> My Submissions & Status
          {totalCount > 0 && (
            <span className={styles.tabCountBadge}>{totalCount}</span>
          )}
        </button>
      </div>

      {/* TAB 1: SUBMISSION FORM */}
      {activeTab === 'submit' && (
        <div className={styles.submitContainer}>
          {/* Sub-tabs: AI Tool vs AI Knowledge */}
          <div className={styles.typeSelectorRow}>
            <span className={styles.selectorLabel}>Select Contribution Type:</span>
            <div className={styles.kindButtons}>
              <button
                type="button"
                className={`${styles.kindBtn} ${kind === 'tool' ? styles.kindSelected : ''}`}
                onClick={() => setKind('tool')}
              >
                <FiSliders /> AI Tool
              </button>
              <button
                type="button"
                className={`${styles.kindBtn} ${kind === 'knowledge' ? styles.kindSelected : ''}`}
                onClick={() => setKind('knowledge')}
              >
                <FiLayers /> AI Knowledge
              </button>
            </div>
          </div>

          {kind === 'knowledge' && (
            <div className={styles.knowledgeTypeGrid}>
              {KNOWLEDGE_TYPE_OPTIONS.map((opt) => {
                const isSelected = knowledgeType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.knowledgeTypeCard} ${isSelected ? styles.knowledgeTypeSelected : ''}`}
                    onClick={() => {
                      setKnowledgeType(opt.id);
                      updateKnowledge('type', opt.id);
                    }}
                  >
                    <div className={styles.knowledgeTypeTitle}>{opt.label}</div>
                    <div className={styles.knowledgeTypeDesc}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              {kind === 'tool' ? (
                <>
                  <Field
                    label="Tool Name"
                    name="tool_name"
                    value={toolData.tool_name}
                    onChange={updateTool}
                    placeholder="e.g. Cursor, v0, Devin"
                    required
                  />
                  <Field
                    label="Website URL"
                    name="website_url"
                    type="url"
                    value={toolData.website_url}
                    onChange={updateTool}
                    placeholder="https://example.com"
                    required
                  />
                  <Select
                    label="Category"
                    name="category"
                    value={toolData.category}
                    onChange={updateTool}
                    options={categories}
                    required
                  />
                  <Field
                    label="Subcategory"
                    name="subcategory"
                    value={toolData.subcategory}
                    onChange={updateTool}
                    placeholder="e.g. Coding Assistants, UI to Code"
                  />
                  <Select
                    label="Pricing Model"
                    name="pricing"
                    value={toolData.pricing}
                    onChange={updateTool}
                    options={['Free', 'Freemium', 'Paid', 'Contact for pricing']}
                    required
                  />
                  <Field
                    label="Target Platforms"
                    name="platforms"
                    value={toolData.platforms}
                    onChange={updateTool}
                    placeholder="Web, Desktop (Mac/Win), VS Code, CLI"
                  />
                  <Field
                    label="Tags (comma-separated)"
                    name="tags"
                    value={toolData.tags}
                    onChange={updateTool}
                    placeholder="coding, autocomplete, agents"
                    wide
                  />
                  <Field
                    label="One-line Description"
                    name="description"
                    value={toolData.description}
                    onChange={updateTool}
                    placeholder="Concise overview of what the tool does..."
                    required
                    wide
                  />
                  <Field
                    label="Why do you recommend it? (Key Features & Review)"
                    name="recommendation_reason"
                    value={toolData.recommendation_reason}
                    onChange={updateTool}
                    placeholder="Explain the unique value, best use cases, and how it improved your workflow..."
                    required
                    wide
                    textarea
                  />
                </>
              ) : (
                <>
                  <Field
                    label={`${CONTRIBUTION_TYPE_LABELS[knowledgeType] || 'Item'} Title`}
                    name="title"
                    value={knowledgeData.title}
                    onChange={updateKnowledge}
                    placeholder={`Descriptive title for this ${knowledgeType}...`}
                    required
                    wide
                  />
                  <Field
                    label="Target AI Model or Platform"
                    name="ai_model"
                    value={knowledgeData.ai_model}
                    onChange={updateKnowledge}
                    placeholder="e.g. Claude 3.5 Sonnet, GPT-4o, Cursor, Universal"
                    required
                  />
                  <Select
                    label="Category"
                    name="category"
                    value={knowledgeData.category}
                    onChange={updateKnowledge}
                    options={categories}
                    required
                  />
                  <Field
                    label="Primary Use Case"
                    name="use_case"
                    value={knowledgeData.use_case}
                    onChange={updateKnowledge}
                    placeholder="e.g. Refactoring, SQL Optimization, UI Design"
                    required
                  />
                  <Field
                    label="Tags (comma-separated)"
                    name="tags"
                    value={knowledgeData.tags}
                    onChange={updateKnowledge}
                    placeholder="architecture, clean-code, prompts"
                  />
                  <Field
                    label="Brief Description & Usage Context"
                    name="description"
                    value={knowledgeData.description}
                    onChange={updateKnowledge}
                    placeholder="Explain when and why to use this knowledge asset..."
                    required
                    wide
                  />
                  <Field
                    label={
                      knowledgeType === 'shortcut'
                        ? 'Shortcut Command & Execution Script'
                        : knowledgeType === 'trick'
                          ? 'Trick Instruction & Template'
                          : knowledgeType === 'guide'
                            ? 'Step-by-Step Guide Content'
                            : 'Prompt Template / Content (supports {{variables}})'
                    }
                    name="prompt_content"
                    value={knowledgeData.prompt_content}
                    onChange={updateKnowledge}
                    placeholder="Paste the complete reusable content here..."
                    required
                    wide
                    textarea
                  />
                </>
              )}
            </div>

            {/* Contributor Identity */}
            <div className={styles.contributor}>
              <Field
                label="Suggested By (Display Name)"
                name="display_name"
                value={kind === 'tool' ? toolData.display_name : knowledgeData.display_name}
                onChange={kind === 'tool' ? updateTool : updateKnowledge}
                placeholder="Your community name or handle"
                required={!(kind === 'tool' ? toolData.is_anonymous : knowledgeData.is_anonymous)}
              />
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={kind === 'tool' ? toolData.is_anonymous : knowledgeData.is_anonymous}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (kind === 'tool') updateTool('is_anonymous', checked);
                    else updateKnowledge('is_anonymous', checked);
                  }}
                />
                Submit anonymously
              </label>
            </div>

            {state.error && <p className={styles.error}><FiAlertCircle /> {state.error}</p>}
            {state.success && (
              <div className={styles.successBox}>
                <p className={styles.success}><FiCheckCircle /> {state.success}</p>
                <button
                  type="button"
                  className={styles.viewStatusBtn}
                  onClick={() => setActiveTab('status')}
                >
                  View in My Submissions &rarr;
                </button>
              </div>
            )}

            <div className={styles.submitBar}>
              {!user && (
                <span className={styles.guestNotice}>
                  * You will be redirected to sign in before submitting.
                </span>
              )}
              <button
                type="submit"
                className={styles.submit}
                disabled={state.loading}
              >
                <FiSend /> {state.loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS & STATUS TRACKER */}
      {activeTab === 'status' && (
        <div className={styles.statusContainer}>
          <div className={styles.statusHeaderRow}>
            <div>
              <h3>Your Submissions History</h3>
              <p>Track the moderation status of your contributed tools, prompts, and knowledge items.</p>
            </div>

            {/* Filter Pills */}
            <div className={styles.filterPills}>
              {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.filterPill} ${statusFilter === s ? styles.filterPillActive : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all'
                    ? `All (${totalCount})`
                    : s === 'pending'
                      ? `Pending (${pendingCount})`
                      : s === 'approved'
                        ? `Approved (${allSubmissions.filter((x) => x.status === 'approved').length})`
                        : `Rejected (${allSubmissions.filter((x) => x.status === 'rejected').length})`}
                </button>
              ))}
            </div>
          </div>

          {actionFeedback && (
            <div className={styles.actionFeedbackAlert}>
              {actionFeedback}
            </div>
          )}

          {!user ? (
            <div className={styles.authNoticeCard}>
              <FiClock className={styles.authNoticeIcon} />
              <h4>Sign in to view your submissions</h4>
              <p>Sign in with your CodeCraft account to track moderation progress and edit pending contributions.</p>
              <Link href="/login?next=/contribute" className={styles.loginBtn}>
                Sign In &rarr;
              </Link>
            </div>
          ) : loadingSubmissions ? (
            <div className={styles.loadingState}>
              <FiClock className={styles.spin} /> Loading your contributions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className={styles.emptySubmissions}>
              <FiLayers className={styles.emptyIcon} />
              <h4>No {statusFilter === 'all' ? '' : statusFilter} submissions found</h4>
              <p>You haven't submitted any contributions under this filter yet.</p>
              <button
                type="button"
                className={styles.newContributionBtn}
                onClick={() => setActiveTab('submit')}
              >
                + Submit a New Contribution
              </button>
            </div>
          ) : (
            <div className={styles.submissionsGrid}>
              {filteredSubmissions.map((sub) => {
                const isTool = sub.kind === 'tool';
                const typeLabel = isTool
                  ? 'AI Tool'
                  : (CONTRIBUTION_TYPE_LABELS[sub.type] || sub.type || 'Knowledge');

                return (
                  <article key={sub.id} className={styles.statusCard}>
                    <div className={styles.statusCardHeader}>
                      <div className={styles.badges}>
                        <span className={styles.subTypeBadge}>{typeLabel}</span>
                        <span className={styles.subCategoryBadge}>{sub.category}</span>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`${styles.statusPill} ${
                          sub.status === 'approved'
                            ? styles.statusApproved
                            : sub.status === 'rejected'
                              ? styles.statusRejected
                              : styles.statusPending
                        }`}
                      >
                        {sub.status === 'approved' ? (
                          <><FiCheckCircle /> Published</>
                        ) : sub.status === 'rejected' ? (
                          <><FiAlertCircle /> Rejected</>
                        ) : (
                          <><FiClock /> Under Review</>
                        )}
                      </span>
                    </div>

                    <h4 className={styles.subTitle}>
                      {isTool ? sub.tool_name : sub.title}
                    </h4>
                    <p className={styles.subDesc}>{sub.description}</p>

                    {/* Content preview */}
                    {sub.prompt_content && (
                      <pre className={styles.contentSnippet}>
                        {sub.prompt_content.slice(0, 160)}
                        {sub.prompt_content.length > 160 ? '...' : ''}
                      </pre>
                    )}

                    {/* Admin notes if present */}
                    {sub.admin_notes && (
                      <div className={styles.adminNotesBox}>
                        <strong>Moderation Note:</strong> {sub.admin_notes}
                      </div>
                    )}

                    <div className={styles.subFooter}>
                      <small className={styles.subDate}>
                        Submitted {new Date(sub.created_at).toLocaleDateString()}
                      </small>

                      <div className={styles.subActions}>
                        {sub.status === 'pending' && (
                          <button
                            type="button"
                            className={styles.withdrawBtn}
                            onClick={() => handleWithdraw(sub.id, sub.kind)}
                            title="Withdraw submission"
                          >
                            <FiTrash2 /> Withdraw
                          </button>
                        )}
                        {sub.status === 'approved' && isTool && (
                          <Link
                            href={`/ai-tools`}
                            className={styles.viewPublishedLink}
                          >
                            View in Catalog <FiExternalLink />
                          </Link>
                        )}
                        {sub.status === 'approved' && !isTool && (
                          <Link
                            href={`/ai-knowledge/${sub.id}`}
                            className={styles.viewPublishedLink}
                          >
                            View in AI Knowledge <FiExternalLink />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  wide,
  textarea,
}) {
  const Input = textarea ? 'textarea' : 'input';
  return (
    <label className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <span>{label} {required && <strong className={styles.req}>*</strong>}</span>
      <Input
        name={name}
        type={textarea ? undefined : type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={textarea ? 6 : undefined}
      />
    </label>
  );
}

function Select({ label, name, value, onChange, options, required }) {
  return (
    <label className={styles.field}>
      <span>{label} {required && <strong className={styles.req}>*</strong>}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      >
        <option value="">Choose a category...</option>
        {options.map((opt) => (
          <option key={opt.slug || opt} value={opt.slug || opt}>
            {opt.name || opt}
          </option>
        ))}
      </select>
    </label>
  );
}
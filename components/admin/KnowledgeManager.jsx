'use client';

import React, { useState, useMemo } from 'react';
import {
  FiBookOpen,
  FiPlus,
  FiUpload,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiAlertCircle,
  FiFileText,
  FiTag,
  FiCpu,
  FiFolder,
  FiX
} from 'react-icons/fi';
import styles from './KnowledgeManager.module.scss';
import { ALLOWED_KNOWLEDGE_TYPES, KNOWLEDGE_TYPE_LABELS } from '../../lib/knowledge-schema';

export default function KnowledgeManager({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'add' | 'import'
  const [feedback, setFeedback] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form State for Add / Edit
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'prompt',
    prompt_content: '',
    ai_model: 'Claude 3.5 Sonnet',
    category: 'Development',
    use_case: '',
    tags: '',
    description: '',
    display_name: 'CodeCraft Team',
    is_anonymous: false,
  });
  const [saving, setSaving] = useState(false);

  // Import State
  const [jsonInput, setJsonInput] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importing, setImporting] = useState(false);

  const metrics = useMemo(() => {
    const counts = { total: items.length, prompt: 0, trick: 0, shortcut: 0, technique: 0, guide: 0 };
    items.forEach((item) => {
      const t = item.type || 'prompt';
      if (t === 'slash-command' || t === 'shortcut') counts.shortcut++;
      else if (t === 'tip' || t === 'guide') counts.guide++;
      else if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchContent = item.prompt_content?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchContent) return false;
      }

      if (typeFilter !== 'all') {
        const itemType = item.type || 'prompt';
        if (typeFilter === 'shortcut' && !['shortcut', 'slash-command'].includes(itemType)) return false;
        if (typeFilter === 'guide' && !['guide', 'tip'].includes(itemType)) return false;
        if (!['shortcut', 'guide'].includes(typeFilter) && itemType !== typeFilter) return false;
      }

      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, typeFilter, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this knowledge item?')) return;
    try {
      const res = await fetch(`/api/admin/knowledge?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
        setFeedback({ type: 'success', message: 'Knowledge item deleted successfully.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: data.error || 'Failed to delete knowledge item.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error while deleting item.' });
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      type: item.type || 'prompt',
      prompt_content: item.prompt_content || '',
      ai_model: item.ai_model || 'Universal',
      category: item.category || 'Development',
      use_case: item.use_case || (item.use_cases?.[0] || ''),
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      description: item.description || '',
      display_name: item.display_name || 'CodeCraft Team',
      is_anonymous: Boolean(item.is_anonymous),
    });
    setActiveTab('add');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      use_cases: formData.use_case ? [formData.use_case] : [],
    };

    if (editingItem) {
      payload.originalId = editingItem.id;
      payload.id = editingItem.id;
    }

    try {
      const res = await fetch('/api/admin/knowledge', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (editingItem) {
          setItems((prev) => prev.map((i) => (i.id === editingItem.id ? result.item : i)));
          setFeedback({ type: 'success', message: `Knowledge item "${result.item.title}" updated!` });
        } else {
          setItems((prev) => [result.item, ...prev]);
          setFeedback({ type: 'success', message: `Knowledge item "${result.item.title}" created!` });
        }
        setEditingItem(null);
        setFormData({
          title: '',
          type: 'prompt',
          prompt_content: '',
          ai_model: 'Claude 3.5 Sonnet',
          category: 'Development',
          use_case: '',
          tags: '',
          description: '',
          display_name: 'CodeCraft Team',
          is_anonymous: false,
        });
        setActiveTab('all');
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: err.error || 'Failed to save knowledge item.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error saving knowledge item.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewImport = async () => {
    if (!jsonInput.trim()) {
      setFeedback({ type: 'error', message: 'Please provide valid JSON content.' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object') parsed = [parsed];
        else throw new Error('Expected JSON array of objects');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Invalid JSON syntax: ${err.message}` });
      return;
    }

    setImporting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/knowledge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', items: parsed }),
      });

      if (res.ok) {
        const previewData = await res.json();
        setImportPreview({ ...previewData, rawItems: parsed });
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: err.error || 'Import preview failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error during import preview.' });
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.rawItems) return;
    setImporting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/knowledge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          items: importPreview.rawItems,
          overwriteExisting,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh catalog
        const refetch = await fetch('/api/admin/knowledge');
        if (refetch.ok) {
          const fresh = await refetch.json();
          setItems(fresh);
        }
        setFeedback({
          type: 'success',
          message: `Import complete: ${data.importedCount} added, ${data.updatedCount} updated, ${data.skippedCount} skipped.`,
        });
        setImportPreview(null);
        setJsonInput('');
        setActiveTab('all');
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: err.error || 'Import operation failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error confirming import.' });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result || '');
      setImportPreview(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>AI Knowledge Management</h1>
          <p>Curate, publish, and bulk import prompts, tricks, slash commands, and prompting techniques.</p>
        </div>
      </div>

      {feedback && (
        <div className={`${styles.alert} ${styles[feedback.type]}`}>
          {feedback.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('all');
            setEditingItem(null);
          }}
        >
          <FiBookOpen /> All Content ({items.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'add' ? styles.active : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <FiPlus /> {editingItem ? 'Edit Item' : 'Add Content'}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'import' ? styles.active : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <FiUpload /> Import JSON
        </button>
      </div>

      {/* TAB 1: ALL CONTENT */}
      {activeTab === 'all' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard} onClick={() => setTypeFilter('all')}>
              <span className={styles.metricLabel}>Total Items</span>
              <span className={styles.metricValue}>{metrics.total}</span>
            </div>
            <div className={styles.metricCard} onClick={() => setTypeFilter('prompt')}>
              <span className={styles.metricLabel}>Prompts</span>
              <span className={styles.metricValue}>{metrics.prompt}</span>
            </div>
            <div className={styles.metricCard} onClick={() => setTypeFilter('trick')}>
              <span className={styles.metricLabel}>Tricks</span>
              <span className={styles.metricValue}>{metrics.trick}</span>
            </div>
            <div className={styles.metricCard} onClick={() => setTypeFilter('shortcut')}>
              <span className={styles.metricLabel}>Shortcuts</span>
              <span className={styles.metricValue}>{metrics.shortcut}</span>
            </div>
            <div className={styles.metricCard} onClick={() => setTypeFilter('technique')}>
              <span className={styles.metricLabel}>Techniques</span>
              <span className={styles.metricValue}>{metrics.technique}</span>
            </div>
            <div className={styles.metricCard} onClick={() => setTypeFilter('guide')}>
              <span className={styles.metricLabel}>Guides &amp; Tips</span>
              <span className={styles.metricValue}>{metrics.guide}</span>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.searchRow}>
              <div className={styles.searchInput}>
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by title, prompt text, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.filtersRow}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="prompt">Prompts</option>
                <option value="trick">Tricks</option>
                <option value="shortcut">Shortcuts / Slash Commands</option>
                <option value="technique">Techniques</option>
                <option value="guide">Guides &amp; Tips</option>
              </select>

              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Model</th>
                  <th>Category</th>
                  <th>Prompt Snippet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No knowledge items found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        {item.use_case && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.use_case}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={styles.typeBadge}>
                          {KNOWLEDGE_TYPE_LABELS[item.type] || item.type || 'Prompt'}
                        </span>
                      </td>
                      <td>{item.ai_model || 'Universal'}</td>
                      <td>{item.category || 'General'}</td>
                      <td>
                        <div className={styles.snippetCell}>
                          {item.prompt_content ? item.prompt_content.slice(0, 70) + '...' : <i>Empty</i>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button type="button" onClick={() => startEdit(item)} title="Edit item">
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(item.id)}
                            title="Delete item"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 2: ADD / EDIT CONTENT */}
      {activeTab === 'add' && (
        <div className={styles.formCard}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>
            {editingItem ? `Edit: ${editingItem.title}` : 'Add New Knowledge Item'}
          </h2>
          <form onSubmit={handleSaveForm}>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 16 App Router Component Scaffold"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Content Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="prompt">Prompt</option>
                  <option value="trick">Trick</option>
                  <option value="shortcut">Shortcut / Slash Command</option>
                  <option value="technique">Technique</option>
                  <option value="guide">Guide / Tip</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>AI Model</label>
                <input
                  type="text"
                  placeholder="e.g. Claude 3.5 Sonnet, GPT-4o, Cursor"
                  value={formData.ai_model}
                  onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Development, Writing, Productivity"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Use Case</label>
                <input
                  type="text"
                  placeholder="e.g. Full-stack Web Development"
                  value={formData.use_case}
                  onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. nextjs, react, typescript, tailwind"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description / Overview</label>
                <input
                  type="text"
                  placeholder="Brief summary of what this prompt or pattern achieves"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Prompt Content / Instructions *</label>
                <textarea
                  rows={6}
                  placeholder="Enter the complete prompt template, shortcut, or pattern..."
                  value={formData.prompt_content}
                  onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
                  required
                />
                <span className={styles.hint}>Supports template parameters like {'{{ComponentName}}'} or [TECH_STACK]</span>
              </div>

              <div className={styles.formGroup}>
                <label>Contributor Display Name</label>
                <input
                  type="text"
                  placeholder="CodeCraft Team"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button type="submit" disabled={saving} className={styles.submitBtn}>
                {saving ? 'Saving...' : editingItem ? 'Update Knowledge Item' : 'Create Knowledge Item'}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setActiveTab('all');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-medium)',
                    padding: '0.65rem 1.2rem',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: IMPORT JSON */}
      {activeTab === 'import' && (
        <div className={styles.formCard}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>
            Bulk JSON Knowledge Import
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Import arrays of knowledge items. The validator checks required fields, formats tags, and prevents invalid records from entering the catalog.
          </p>

          <div
            className={styles.importDropzone}
            onClick={() => document.getElementById('json-file-input')?.click()}
          >
            <FiUpload />
            <h3>Click to Upload JSON File</h3>
            <p>Select a .json file containing an array of AI knowledge items</p>
            <input
              id="json-file-input"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Or Paste JSON directly:
            </label>
            <textarea
              rows={8}
              placeholder='[ { "title": "Example Prompt", "type": "prompt", "prompt_content": "...", "category": "Development" } ]'
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setImportPreview(null);
              }}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              disabled={importing || !jsonInput.trim()}
              onClick={handlePreviewImport}
              className={styles.submitBtn}
            >
              {importing ? 'Validating...' : 'Validate & Preview JSON'}
            </button>
          </div>

          {importPreview && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <h3>Validation Summary</h3>
              <div className={styles.previewStats}>
                <span className={`${styles.previewStatBadge} ${styles.valid}`}>
                  {importPreview.summary.validCount} New Valid Items
                </span>
                <span className={`${styles.previewStatBadge} ${styles.existing}`}>
                  {importPreview.summary.existingCount} Existing / Duplicate IDs
                </span>
                <span className={`${styles.previewStatBadge} ${styles.invalid}`}>
                  {importPreview.summary.invalidCount} Invalid Records
                </span>
              </div>

              {importPreview.summary.existingCount > 0 && (
                <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="overwrite-check"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                  />
                  <label htmlFor="overwrite-check" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Overwrite and update existing matching records
                  </label>
                </div>
              )}

              {importPreview.invalid?.length > 0 && (
                <div style={{ margin: '1rem 0', background: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.85rem' }}>
                  <strong>Errors detected in {importPreview.invalid.length} records:</strong>
                  <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem' }}>
                    {importPreview.invalid.map((inv, i) => (
                      <li key={i}>{inv.title || `Item #${inv.index + 1}`}: {inv.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                disabled={importing || (importPreview.summary.validCount === 0 && (!overwriteExisting || importPreview.summary.existingCount === 0))}
                onClick={handleConfirmImport}
                className={styles.submitBtn}
                style={{ marginTop: '0.5rem' }}
              >
                {importing ? 'Importing...' : 'Confirm & Apply Import'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

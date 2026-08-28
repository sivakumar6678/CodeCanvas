'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiUpload, FiX } from 'react-icons/fi';
import styles from './ToolJsonImport.module.scss';

const SCHEMA_PROMPT = `Convert this tool list into CodeCraft JSON. Return only a valid JSON array. Every object must include id, name, slug, description, category, pricing, and website. Preserve names and URLs, generate unique string IDs and lowercase hyphenated slugs, use only the supported categories shown in Studio, generate tags and useCases only from supplied information, and use empty optional values instead of inventing facts.`;

export default function BulkToolJsonImport({ categories }) {
  const [text, setText] = useState('');
  const [records, setRecords] = useState([]);
  const [classification, setClassification] = useState(null);
  const [mode, setMode] = useState('upsert');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  async function preview(input) {
    setErrors([]); setMessage(''); setClassification(null);
    let parsed;
    try { parsed = JSON.parse(input); } catch { setErrors(['Invalid JSON. Check commas, quotes, and brackets.']); return; }
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview', records: parsed, mode }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok && response.status !== 409) { setErrors(result.errors || [result.error || 'Validation failed.']); return; }
    setRecords(result.records || []); setClassification(result); setMessage(result.invalidRecords?.length ? 'Review the summary. Invalid records will be skipped.' : 'Review the summary and preview before applying changes.');
  }

  async function previewFile(file) { const value = await file.text(); setText(value); await preview(value); }

  async function apply() {
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply', records, mode }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setErrors(result.errors || [result.error || 'Import failed.']); return; }
    setMessage(`Applied changes: ${result.updated} updated and ${result.imported} added; ${result.skipped || 0} skipped.`); setClassification(null); setRecords([]);
  }

  async function copyPrompt() { await navigator.clipboard.writeText(SCHEMA_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  const summary = classification?.summary;
  return <section className={styles.importer}><div className={styles.importHeader}><div><h2>Bulk JSON update</h2><p>Match by stable ID first, then slug. Existing metadata is updated in JSON without changing saved tools, reviews, or analytics.</p></div><button type="button" onClick={() => setShowPrompt(true)} className={styles.helpButton}><FiDownload /> JSON prompt</button></div><div className={styles.supportedCategories}><strong>Supported categories</strong><span>{categories.map((category) => `${category.name} (${category.slug})`).join('  |  ')}</span></div><div className={styles.sources}><div className={styles.source}><h3>Upload JSON</h3><label className={styles.upload}><FiUpload /><span>{loading ? 'Working...' : 'Choose a JSON file'}</span><input type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && previewFile(event.target.files[0])} disabled={loading} /></label></div><div className={styles.source}><h3>Paste JSON</h3><textarea className={styles.paste} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste an array of tool objects..." disabled={loading} /><button type="button" className={styles.validatePaste} onClick={() => preview(text)} disabled={loading || !text.trim()}><FiCheck /> Preview changes</button></div></div><div className={styles.modeRow}><strong>Bulk action</strong><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="upsert">Update + Import All</option><option value="update-existing">Update All Existing</option><option value="import-new">Import All New</option></select></div>{message && <p className={styles.success}><FiCheck /> {message}</p>}{errors.length > 0 && <div className={styles.errors}><strong>Import blocked:</strong><ul>{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}{summary && <div className={styles.summary}><div><strong>{summary.existing}</strong><span>Existing</span></div><div><strong>{summary.new}</strong><span>New</span></div><div><strong>{summary.invalid}</strong><span>Invalid</span></div><div><strong>{summary.conflicts}</strong><span>Conflicts</span></div></div>}{classification?.preview && <div className={styles.preview}><div className={styles.previewHeader}><strong>What will happen</strong><button type="button" onClick={apply} disabled={loading} className={styles.confirm}>Apply changes</button></div><div className={styles.previewList}><div className={styles.previewRow}><span>Added</span><small>{classification.preview.added.length}</small></div><div className={styles.previewRow}><span>Updated</span><small>{classification.preview.updated.length}</small></div><div className={styles.previewRow}><span>Skipped</span><small>{classification.preview.skipped.length}</small></div><div className={styles.previewRow}><span>Invalid</span><small>{classification.preview.invalid.length}</small></div>{records.map((record) => <div key={`${record.id}-${record.slug}`} className={styles.previewRow}><span>{record.name}</span><small>{record.category} / {record.slug}</small></div>)}</div></div>}{showPrompt && <div className={styles.overlay}><div className={styles.modal}><div className={styles.modalHeader}><h2>JSON generator prompt</h2><button type="button" onClick={() => setShowPrompt(false)}><FiX /></button></div><textarea readOnly value={SCHEMA_PROMPT} /><button type="button" className={styles.copy} onClick={copyPrompt}><FiCopy /> {copied ? 'Copied' : 'Copy prompt'}</button></div></div>}</section>;
}

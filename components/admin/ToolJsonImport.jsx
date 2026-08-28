'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiUpload, FiX } from 'react-icons/fi';
import styles from './ToolJsonImport.module.scss';

const GENERATOR_PROMPT = `Convert the following list of AI tools into the exact JSON schema used by CodeCraft.

Return only valid JSON: an array of tool objects, with no markdown fences or explanation.
Each object must use exactly these fields when known: id, name, slug, logo, banner, description, overview, features, pros, cons, website, category, subCategory, pricing, freeTrial, platform, tags, useCases, bestFor, featured, new, verified, createdDate.

Rules:
- Preserve original tool names and website URLs exactly.
- Generate a unique lowercase hyphenated slug and a unique string id for every tool.
- Use consistent category and subCategory values from the supplied information; do not invent categories.
- Generate concise tags and useCases only from information present in the source.
- Do not invent logos, features, pricing, platforms, claims, or other unknown information. Use empty strings or arrays where information is unavailable.
- Use pricing values only from: Free, Freemium, Free / Freemium, Paid, Contact for pricing.
- Return a valid JSON array that matches the schema exactly.

Tools to convert:
[PASTE TOOL LIST HERE]`;

export default function ToolJsonImport({ categories }) {
  const [records, setRecords] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  async function validateText(text) {
    setMessage('');
    setErrors([]);
    setRecords([]);
    let parsed;
    try { parsed = JSON.parse(text); } catch { setErrors(['Invalid JSON. Check commas, quotes, and brackets.']); return; }
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'validate', records: parsed }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setErrors(result.errors || [result.error || 'Validation failed.']); return; }
    setRecords(result.records || []);
    setMessage(result.message || 'Ready to import.');
  }

  async function validateFile(file) {
    await validateText(await file.text());
  }

  async function importRecords() {
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', records }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setErrors(result.errors || [result.error || 'Import failed.']); return; }
    setMessage(`Imported ${result.imported} tool${result.imported === 1 ? '' : 's'} into ${result.categories.join(', ')}.`);
    setRecords([]);
  }

  async function copyPrompt() { await navigator.clipboard.writeText(GENERATOR_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return <section className={styles.importer}><div className={styles.importHeader}><div><h2>Import AI Tools JSON</h2><p>Validate and preview records before merging them into the curated catalog.</p></div><button type="button" onClick={() => setShowPrompt(true)} className={styles.helpButton}><FiDownload /> JSON generator prompt</button></div><div className={styles.sources}><div className={styles.source}><h3>Upload a file</h3><label className={styles.upload}><FiUpload /><span>{loading ? 'Working...' : 'Choose a JSON file'}</span><input type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && validateFile(event.target.files[0])} disabled={loading} /></label></div><div className={styles.source}><h3>Paste JSON directly</h3><textarea className={styles.paste} value={jsonText} onChange={(event) => setJsonText(event.target.value)} placeholder="Paste an array of AI tool objects here..." disabled={loading} /><button type="button" className={styles.validatePaste} onClick={() => validateText(jsonText)} disabled={loading || !jsonText.trim()}><FiCheck /> Validate pasted JSON</button></div></div>{message && <p className={styles.success}><FiCheck /> {message}</p>}{errors.length > 0 && <div className={styles.errors}><strong>Fix these issues before importing:</strong><ul>{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}{records.length > 0 && <div className={styles.preview}><div className={styles.previewHeader}><strong>Preview ({records.length})</strong><button type="button" onClick={importRecords} disabled={loading} className={styles.confirm}>Confirm import</button></div><div className={styles.previewList}>{records.map((record) => <div key={record.id} className={styles.previewRow}><span>{record.name}</span><small>{record.category} / {record.pricing}</small></div>)}</div></div>}{showPrompt && <div className={styles.overlay}><div className={styles.modal}><div className={styles.modalHeader}><h2>JSON generator prompt</h2><button type="button" onClick={() => setShowPrompt(false)}><FiX /></button></div><textarea readOnly value={GENERATOR_PROMPT} /><button type="button" className={styles.copy} onClick={copyPrompt}><FiCopy /> {copied ? 'Copied' : 'Copy prompt'}</button></div></div>}</section>;
}
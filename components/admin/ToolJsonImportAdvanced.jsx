'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiUpload, FiX } from 'react-icons/fi';
import styles from './ToolJsonImport.module.scss';

const GENERATOR_PROMPT = `Convert the following list of AI tools into the exact JSON schema used by CodeCraft.

Return only valid JSON: an array of tool objects, with no markdown fences or explanation.
Each object must include: id, name, slug, description, category, pricing, website.
Optional fields include: logo, banner, overview, features, pros, cons, subCategory, freeTrial, platform, tags, useCases, bestFor, featured, new, verified, createdDate.

Rules:
- Preserve original tool names and website URLs exactly.
- Generate a unique string id and lowercase hyphenated slug for every tool.
- Use only the supported categories supplied by the application.
- Generate consistent subcategories, tags, and useCases from the source information.
- Do not invent unknown logos, features, pricing, platforms, claims, or URLs.
- Use pricing values only from: Free, Freemium, Free / Freemium, Paid, Contact for pricing.
- Return only a valid JSON array matching the schema.

Tools to convert:
[PASTE TOOL LIST HERE]`;

export default function ToolJsonImportAdvanced({ categories }) {
  const [records, setRecords] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [errors, setErrors] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  async function validateText(text) {
    setMessage('');
    setErrors([]);
    setConflicts([]);
    setResolutions({});
    setRecords([]);
    let parsed;
    try { parsed = JSON.parse(text); } catch { setErrors(['Invalid JSON. Check commas, quotes, and brackets.']); return; }
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'validate', records: parsed }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setErrors(result.errors || [result.error || 'Validation failed.']); return; }
    setRecords(result.records || []);
    setConflicts(result.conflicts || []);
    setMessage(result.conflicts?.length ? 'Validation passed. Resolve the catalog conflicts before importing.' : result.message || 'Ready to import.');
  }

  async function validateFile(file) { await validateText(await file.text()); }

  function setResolution(recordIndex, action, slug = '') {
    setResolutions((current) => ({ ...current, [recordIndex]: { action, ...(slug ? { slug } : {}) } }));
  }

  async function importRecords() {
    setLoading(true);
    const response = await fetch('/api/admin/tools/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', records, resolutions }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setErrors(result.errors || [result.error || 'Import failed.']); return; }
    setMessage(`Imported ${result.imported} tool${result.imported === 1 ? '' : 's'} into ${result.categories.join(', ')}.`);
    setRecords([]);
    setConflicts([]);
    setResolutions({});
  }

  async function copyPrompt() { await navigator.clipboard.writeText(GENERATOR_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  const unresolvedConflicts = conflicts.filter((conflict) => !resolutions[conflict.recordIndex] || (resolutions[conflict.recordIndex].action === 'import' && !resolutions[conflict.recordIndex].slug));

  return <section className={styles.importer}>
    <div className={styles.importHeader}><div><h2>Import AI Tools JSON</h2><p>Validate and preview records before merging them into the curated catalog.</p></div><button type="button" onClick={() => setShowPrompt(true)} className={styles.helpButton}><FiDownload /> JSON generator prompt</button></div>
    <div className={styles.supportedCategories}><strong>Supported categories</strong><span>{categories.map((category) => `${category.name} (${category.slug})`).join('  |  ')}</span></div>
    <div className={styles.sources}><div className={styles.source}><h3>Upload a file</h3><label className={styles.upload}><FiUpload /><span>{loading ? 'Working...' : 'Choose a JSON file'}</span><input type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && validateFile(event.target.files[0])} disabled={loading} /></label></div><div className={styles.source}><h3>Paste JSON directly</h3><textarea className={styles.paste} value={jsonText} onChange={(event) => setJsonText(event.target.value)} placeholder="Paste an array of AI tool objects here..." disabled={loading} /><button type="button" className={styles.validatePaste} onClick={() => validateText(jsonText)} disabled={loading || !jsonText.trim()}><FiCheck /> Validate pasted JSON</button></div></div>
    {message && <p className={styles.success}><FiCheck /> {message}</p>}
    {errors.length > 0 && <div className={styles.errors}><strong>Fix these issues before importing:</strong><ul>{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}
    {conflicts.length > 0 && <div className={styles.conflicts}><strong>Catalog conflicts</strong>{conflicts.map((conflict) => <div key={`${conflict.recordIndex}-${conflict.field}`} className={styles.conflict}><p>{conflict.message}</p><div className={styles.conflictControls}><select value={resolutions[conflict.recordIndex]?.action || ''} onChange={(event) => setResolution(conflict.recordIndex, event.target.value)}><option value="">Choose action...</option><option value="skip">Skip this record</option>{!conflict.type.startsWith('uploaded-') && <option value="replace">Replace existing record</option>}<option value="import">Import with corrected slug</option></select>{resolutions[conflict.recordIndex]?.action === 'import' && <input value={resolutions[conflict.recordIndex]?.slug || ''} onChange={(event) => setResolution(conflict.recordIndex, 'import', event.target.value)} placeholder="new-unique-slug" aria-label="Corrected unique slug" />}</div></div>)}</div>}
    {records.length > 0 && <div className={styles.preview}><div className={styles.previewHeader}><strong>Preview ({records.length})</strong><button type="button" onClick={importRecords} disabled={loading || unresolvedConflicts.length > 0} className={styles.confirm}>Confirm import</button></div><div className={styles.previewList}>{records.map((record) => <div key={`${record.id}-${record.slug}`} className={styles.previewRow}><span>{record.name}</span><small>{record.category} / {record.pricing}{conflicts.some((conflict) => conflict.recordIndex === records.indexOf(record)) ? ' / conflict requires decision' : ''}</small></div>)}</div></div>}
    {showPrompt && <div className={styles.overlay}><div className={styles.modal}><div className={styles.modalHeader}><h2>JSON generator prompt</h2><button type="button" onClick={() => setShowPrompt(false)}><FiX /></button></div><textarea readOnly value={GENERATOR_PROMPT} /><button type="button" className={styles.copy} onClick={copyPrompt}><FiCopy /> {copied ? 'Copied' : 'Copy prompt'}</button></div></div>}
  </section>;
}

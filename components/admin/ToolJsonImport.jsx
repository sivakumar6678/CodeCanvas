'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiUpload, FiX } from 'react-icons/fi';
import styles from './ToolJsonImport.module.scss';

const GENERATOR_PROMPT = `Convert the following list of AI tools into the exact JSON schema used by CodeCraft.

Return only valid JSON: an array of tool objects, with no markdown fences or explanation.
Each object MUST use these EXACT canonical field names: id, name, slug, category, subCategory, description, fullOverview, website, logoImageUrl, bannerImageUrl, keyFeatures, pros, cons, pricingModel, platforms, tags, useCases, bestFor, featured, new, verified, hasFree, createdDate.

REQUIRED CANONICAL FIELD NAMES:
{
  "id": "unique-tool-id-string",
  "name": "Tool Name",
  "slug": "tool-name-lowercase-hyphenated",
  "category": "category-name-lowercase",
  "subCategory": "subcategory or empty string",
  "description": "Short 1-2 sentence description for cards",
  "fullOverview": "Complete overview and details for the tool detail page",
  "website": "https://exact-url.com",
  "logoImageUrl": "https://url-to-logo-image.png (or empty string)",
  "bannerImageUrl": "https://url-to-banner-image.png (or empty string)",
  "keyFeatures": ["Feature 1", "Feature 2"],
  "pros": ["Pro 1", "Pro 2"],
  "cons": ["Con 1", "Con 2"],
  "pricingModel": "Free, Freemium, Free / Freemium, Paid, or Contact for pricing",
  "platforms": ["Web", "Windows", "macOS"],
  "tags": ["AI", "Design", "Development"],
  "useCases": ["Code generation", "Design assistance"],
  "bestFor": ["Developers", "Designers"],
  "featured": false,
  "new": false,
  "verified": false,
  "hasFree": true,
  "createdDate": "2024-01-01T00:00:00Z"
}

CRITICAL RULES:
- Use ONLY the field names listed above. No aliases like 'logo', 'banner', 'features', 'pricing', 'freeTrial', 'platform', or other variants.
- Preserve original tool names and website URLs exactly.
- Generate unique lowercase hyphenated slugs and unique string IDs.
- Use category/subCategory values from supported categories only; do not invent new ones.
- For array fields (keyFeatures, pros, cons, platforms, tags, useCases, bestFor): return [] if information is not available.
- Do not invent logos, banners, features, pricing details, or URLs. Leave imageUrl fields empty string "" if unknown.
- Use pricingModel values ONLY from: Free, Freemium, Free / Freemium, Paid, Contact for pricing.
- Never copy the logoImageUrl value into bannerImageUrl.
- Return valid JSON with proper escaping and array syntax.

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
    
    // Validate JSON format
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setErrors(['Invalid JSON. Check commas, quotes, and brackets.']);
      return;
    }

    // Validate against server
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', records: parsed })
      });

      const result = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        setErrors(result.errors || [result.error || 'Validation failed.']);
        return;
      }

      setRecords(result.records || []);
      setMessage(result.message || 'Ready to import.');
    } catch (error) {
      console.error('Validation error:', error);
      setErrors(['Failed to validate JSON. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  async function validateFile(file) {
    try {
      const text = await file.text();
      await validateText(text);
    } catch (error) {
      console.error('File read error:', error);
      setErrors(['Failed to read file. Please try again.']);
    }
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
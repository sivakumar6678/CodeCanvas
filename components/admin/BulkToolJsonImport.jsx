'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiCopy, FiDownload, FiImage, FiUpload, FiX } from 'react-icons/fi';
import { formatToolComparisonValue, getToolComparisonFields } from '../../lib/tool-comparison';
import ToolImageStatus from './ToolImageStatus';
import { IMAGE_STATUS } from '../../lib/image-validation';
import styles from './ToolJsonImport.module.scss';

const SCHEMA_PROMPT = `Convert this tool list into CodeCanvas JSON. Return only a valid JSON array using the canonical schema: id, name, slug, category, subCategory, description, fullOverview, website, logoImageUrl, bannerImageUrl, keyFeatures, pros, cons, pricingModel, platforms, tags, useCases, bestFor, featured, new, verified, hasFree, createdDate. Category is mandatory and must be a normalized meaningful main-category slug. Reuse an existing category when it accurately fits; create a new meaningful main category only when no existing category fits. Do not force an unrelated category. Subcategory is optional and may be omitted or null. Use tags and useCases for additional classification. Preserve names and URLs, generate unique string IDs and lowercase hyphenated slugs, generate tags, platforms, and useCases only from supplied information, and leave empty optional values instead of inventing facts.`;

const STORAGE_KEY = 'codecanvas_bulk_import_session';

export default function BulkToolJsonImport({ categories, onImportComplete, onImagesUpdated }) {
  const [text, setText] = useState('');
  const [records, setRecords] = useState([]);
  const [classification, setClassification] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [mode, setMode] = useState('upsert');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRestoredSession, setIsRestoredSession] = useState(false);

  // Image update workflow state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  const [brokenImages, setBrokenImages] = useState({});
  const [customImages, setCustomImages] = useState({});
  const [updatingImages, setUpdatingImages] = useState(false);

  // Inline Image Editor Modal state
  const [editingImage, setEditingImage] = useState(null);
  const [editorUrl, setEditorUrl] = useState('');
  const [savingEditedImage, setSavingEditedImage] = useState(false);
  const [editorError, setEditorError] = useState('');

  // Restore session on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
          setText(parsed.text || '');
          setRecords(parsed.records || []);
          setClassification(parsed.classification || null);
          setDecisions(parsed.decisions || {});
          setMode(parsed.mode || 'upsert');
          setCustomImages(parsed.customImages || {});
          setMessage(parsed.message || 'Restored active review session.');
          setIsRestoredSession(true);
        }
      }
    } catch (e) {
      console.warn('Failed to restore import review session:', e);
    }
  }, []);

  // Persist session across changes
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (records && records.length > 0 && classification) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            text,
            records,
            classification,
            decisions,
            mode,
            customImages,
            message,
          })
        );
      }
    } catch (e) {
      console.warn('Failed to save import review session:', e);
    }
  }, [text, records, classification, decisions, mode, customImages, message]);

  function clearSession() {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (_e) {
      // ignore storage access errors
    }
    setText('');
    setRecords([]);
    setClassification(null);
    setDecisions({});
    setCustomImages({});
    setSelectedImages({});
    setBrokenImages({});
    setErrors([]);
    setMessage('');
    setIsRestoredSession(false);
  }

  const imageUpdates = classification?.imageUpdates || [];

  const logosSelectedCount = imageUpdates.reduce((acc, tool) => {
    const isBroken = brokenImages[`${tool.slug}-logo`];
    return acc + (selectedImages[tool.slug]?.replaceLogo && !isBroken ? 1 : 0);
  }, 0);

  const bannersSelectedCount = imageUpdates.reduce((acc, tool) => {
    const isBroken = brokenImages[`${tool.slug}-banner`];
    return acc + (selectedImages[tool.slug]?.replaceBanner && !isBroken ? 1 : 0);
  }, 0);

  const toolsAffectedCount = imageUpdates.reduce((acc, tool) => {
    const sel = selectedImages[tool.slug];
    const logoSel = sel?.replaceLogo && !brokenImages[`${tool.slug}-logo`];
    const bannerSel = sel?.replaceBanner && !brokenImages[`${tool.slug}-banner`];
    return acc + (logoSel || bannerSel ? 1 : 0);
  }, 0);

  async function preview(input) {
    setErrors([]);
    setMessage('');
    setClassification(null);
    setDecisions({});
    setSelectedImages({});
    setBrokenImages({});
    setCustomImages({});
    setIsRestoredSession(false);

    // Validate JSON format
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch {
      setErrors(['Invalid JSON. Check commas, quotes, and brackets.']);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', records: parsed, mode })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 409) {
        setErrors(result.errors || [result.error || 'Validation failed.']);
        return;
      }

      setRecords(result.records || []);
      setClassification(result);
      setMessage(
        result.invalidRecords?.length
          ? 'Review the summary. Invalid records will be skipped.'
          : 'Review the summary and preview before applying changes.'
      );
    } catch (error) {
      console.error('Preview error:', error);
      setErrors(['Failed to preview changes. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  async function previewFile(file) {
    try {
      const value = await file.text();
      setText(value);
      await preview(value);
    } catch (error) {
      console.error('File read error:', error);
      setErrors(['Failed to read file. Please try again.']);
    }
  }

  async function apply() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', records, decisions, mode })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(result.errors || [result.error || 'Import failed.']);
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (_e) {
        // ignore storage access errors
      }

      setMessage(`Import complete: ${result.added || 0} added, ${result.updated || 0} updated/merged, ${result.conflicts || 0} conflicts, ${result.skipped || 0} skipped, ${result.invalid || 0} invalid, ${result.duplicates || 0} duplicates.`);
      setClassification(null);
      setRecords([]);
      setDecisions({});
      setSelectedImages({});
      setCustomImages({});
      setIsRestoredSession(false);

      if (typeof onImportComplete === 'function') {
        onImportComplete();
      }
    } catch (error) {
      console.error('Apply error:', error);
      setErrors(['Failed to apply changes. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  async function applyImageUpdates() {
    setUpdatingImages(true);
    setErrors([]);
    try {
      const updates = imageUpdates
        .map((tool) => {
          const sel = selectedImages[tool.slug];
          if (!sel || (!sel.replaceLogo && !sel.replaceBanner)) return null;

          const effectiveNewLogo = customImages[tool.slug]?.logo !== undefined
            ? customImages[tool.slug].logo
            : tool.newLogo;
          const effectiveNewBanner = customImages[tool.slug]?.banner !== undefined
            ? customImages[tool.slug].banner
            : tool.newBanner;

          const isLogoBroken = Boolean(brokenImages[`${tool.slug}-logo`]);
          const isBannerBroken = Boolean(brokenImages[`${tool.slug}-banner`]);

          return {
            id: tool.id,
            slug: tool.slug,
            replaceLogo: Boolean(sel.replaceLogo && !isLogoBroken && effectiveNewLogo),
            newLogo: effectiveNewLogo,
            replaceBanner: Boolean(sel.replaceBanner && !isBannerBroken && effectiveNewBanner),
            newBanner: effectiveNewBanner,
          };
        })
        .filter(Boolean);

      if (updates.length === 0) {
        setShowImageModal(false);
        setUpdatingImages(false);
        return;
      }

      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-images', updates }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors || [result.error || 'Failed to update images.']);
        return;
      }

      // Preserve entire review session and update comparison blocks in-place
      setClassification((prev) => {
        if (!prev) return prev;

        const updatedConflictRecords = (prev.conflictRecords || []).map((conflict) => {
          const matched = updates.find(
            (u) => (conflict.existing?.id && u.id === conflict.existing.id) || u.slug === conflict.existing?.slug
          );
          if (!matched) return conflict;

          const updatedExisting = { ...conflict.existing };
          if (matched.replaceLogo && matched.newLogo) updatedExisting.logoImageUrl = matched.newLogo;
          if (matched.replaceBanner && matched.newBanner) updatedExisting.bannerImageUrl = matched.newBanner;
          return { ...conflict, existing: updatedExisting };
        });

        const updatedExistingTools = (prev.existingTools || []).map((existing) => {
          const matched = updates.find(
            (u) => (existing.id && u.id === existing.id) || u.slug === existing.slug
          );
          if (!matched) return existing;

          const copy = { ...existing };
          if (matched.replaceLogo && matched.newLogo) copy.logoImageUrl = matched.newLogo;
          if (matched.replaceBanner && matched.newBanner) copy.bannerImageUrl = matched.newBanner;
          return copy;
        });

        const updatedImageUpdates = (prev.imageUpdates || [])
          .map((tool) => {
            const matched = updates.find((u) => u.slug === tool.slug || (u.id && u.id === tool.id));
            if (!matched) return tool;

            const copy = { ...tool };
            if (matched.replaceLogo) {
              copy.currentLogo = matched.newLogo;
              copy.hasLogoChange = false;
            }
            if (matched.replaceBanner) {
              copy.currentBanner = matched.newBanner;
              copy.hasBannerChange = false;
            }
            return copy;
          })
          .filter((t) => t.hasLogoChange || t.hasBannerChange);

        return {
          ...prev,
          conflictRecords: updatedConflictRecords,
          existingTools: updatedExistingTools,
          imageUpdates: updatedImageUpdates,
        };
      });

      setMessage(result.message || `Saved image updates. Review blocks preserved.`);
      setShowImageModal(false);
      setSelectedImages({});

      if (typeof onImagesUpdated === 'function') {
        onImagesUpdated();
      }
    } catch (error) {
      console.error('Image update error:', error);
      setErrors(['Failed to update selected images. Please try again.']);
    } finally {
      setUpdatingImages(false);
    }
  }

  function openImageEditor({ recordIndex, toolId, toolName, toolSlug, side, field, initialUrl }) {
    setEditingImage({
      recordIndex,
      toolId,
      toolName,
      toolSlug,
      side,
      field,
      initialUrl: initialUrl || '',
    });
    setEditorUrl(initialUrl || '');
    setEditorError('');
  }

  async function saveInlineImageEdit() {
    if (!editingImage) return;
    setSavingEditedImage(true);
    setEditorError('');

    const targetUrl = editorUrl.trim();
    const { recordIndex, toolId, toolSlug, toolName, side, field } = editingImage;
    const isLogo = field === 'logoImageUrl';
    const label = isLogo ? 'Logo' : 'Banner';

    try {
      if (side === 'new') {
        // 1. EDITING INCOMING (NEW) IMAGE
        // Updates pending imported tool record for use in 'Use New' or 'Merge'
        // Does NOT mutate catalog via API
        // Does NOT touch existing catalog record
        setRecords((prev) =>
          prev.map((rec, idx) => (idx === recordIndex ? { ...rec, [field]: targetUrl } : rec))
        );

        setClassification((prev) => {
          if (!prev) return prev;

          const updatedConflictRecords = (prev.conflictRecords || []).map((conflict) => {
            if (conflict.recordIndex === recordIndex) {
              return {
                ...conflict,
                record: {
                  ...conflict.record,
                  [field]: targetUrl,
                },
              };
            }
            return conflict;
          });

          const updatedImageUpdates = (prev.imageUpdates || []).map((t) => {
            if (t.slug === toolSlug || (toolId && t.id === toolId)) {
              const updated = { ...t };
              if (isLogo) {
                updated.newLogo = targetUrl;
                updated.hasLogoChange = Boolean(targetUrl && targetUrl !== t.currentLogo);
              } else {
                updated.newBanner = targetUrl;
                updated.hasBannerChange = Boolean(targetUrl && targetUrl !== t.currentBanner);
              }
              return updated;
            }
            return t;
          });

          return {
            ...prev,
            conflictRecords: updatedConflictRecords,
            imageUpdates: updatedImageUpdates,
          };
        });

        setMessage(`Updated incoming ${label} for ${toolName}. Review session preserved.`);
        setEditingImage(null);
      } else {
        // 2. EDITING EXISTING IMAGE
        // Saves directly to catalog using existing selective image update endpoint
        // Preserves review session, ID matches, and user decisions
        const updatePayload = {
          id: toolId,
          slug: toolSlug,
          replaceLogo: isLogo,
          newLogo: targetUrl,
          replaceBanner: !isLogo,
          newBanner: targetUrl,
        };

        const response = await fetch('/api/admin/tools/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-images', updates: [updatePayload] }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setEditorError(result.errors?.[0] || result.error || `Failed to save ${label} to catalog.`);
          return;
        }

        setClassification((prev) => {
          if (!prev) return prev;

          const updatedConflictRecords = (prev.conflictRecords || []).map((conflict) => {
            if (
              (conflict.existing?.id && toolId === conflict.existing.id) ||
              toolSlug === conflict.existing?.slug
            ) {
              const updatedExisting = { ...conflict.existing, [field]: targetUrl };
              return { ...conflict, existing: updatedExisting };
            }
            return conflict;
          });

          const updatedExistingTools = (prev.existingTools || []).map((existing) => {
            if ((existing.id && toolId === existing.id) || toolSlug === existing.slug) {
              return { ...existing, [field]: targetUrl };
            }
            return existing;
          });

          const updatedImageUpdates = (prev.imageUpdates || [])
            .map((item) => {
              if (item.slug === toolSlug || (item.id && item.id === toolId)) {
                const copy = { ...item };
                if (isLogo) {
                  copy.currentLogo = targetUrl;
                  copy.hasLogoChange = Boolean(copy.newLogo && copy.newLogo !== targetUrl);
                } else {
                  copy.currentBanner = targetUrl;
                  copy.hasBannerChange = Boolean(copy.newBanner && copy.newBanner !== targetUrl);
                }
                return copy;
              }
              return item;
            })
            .filter((t) => t.hasLogoChange || t.hasBannerChange);

          return {
            ...prev,
            conflictRecords: updatedConflictRecords,
            existingTools: updatedExistingTools,
            imageUpdates: updatedImageUpdates,
          };
        });

        setMessage(result.message || `Saved existing ${label} for ${toolName} to catalog. Review session preserved.`);
        setEditingImage(null);

        if (typeof onImagesUpdated === 'function') {
          onImagesUpdated();
        }
      }
    } catch (error) {
      console.error('Save inline image edit error:', error);
      setEditorError('Failed to save image. Please check your network and try again.');
    } finally {
      setSavingEditedImage(false);
    }
  }

  async function saveSingleToolImage(tool) {
    const sel = selectedImages[tool.slug] || { replaceLogo: true, replaceBanner: true };
    const effectiveNewLogo = customImages[tool.slug]?.logo !== undefined
      ? customImages[tool.slug].logo
      : tool.newLogo;
    const effectiveNewBanner = customImages[tool.slug]?.banner !== undefined
      ? customImages[tool.slug].banner
      : tool.newBanner;

    const isLogoBroken = Boolean(brokenImages[`${tool.slug}-logo`]);
    const isBannerBroken = Boolean(brokenImages[`${tool.slug}-banner`]);

    const canReplaceLogo = tool.hasLogoChange && Boolean(sel.replaceLogo !== false && !isLogoBroken && effectiveNewLogo);
    const canReplaceBanner = tool.hasBannerChange && Boolean(sel.replaceBanner !== false && !isBannerBroken && effectiveNewBanner);

    if (!canReplaceLogo && !canReplaceBanner) return;

    const update = {
      id: tool.id,
      slug: tool.slug,
      replaceLogo: canReplaceLogo,
      newLogo: effectiveNewLogo,
      replaceBanner: canReplaceBanner,
      newBanner: effectiveNewBanner,
    };

    setUpdatingImages(true);
    setErrors([]);
    try {
      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-images', updates: [update] }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors || [result.error || `Failed to update image for ${tool.name}.`]);
        return;
      }

      setClassification((prev) => {
        if (!prev) return prev;

        const updatedConflictRecords = (prev.conflictRecords || []).map((conflict) => {
          if ((conflict.existing?.id && update.id === conflict.existing.id) || update.slug === conflict.existing?.slug) {
            const updatedExisting = { ...conflict.existing };
            if (update.replaceLogo && update.newLogo) updatedExisting.logoImageUrl = update.newLogo;
            if (update.replaceBanner && update.newBanner) updatedExisting.bannerImageUrl = update.newBanner;
            return { ...conflict, existing: updatedExisting };
          }
          return conflict;
        });

        const updatedExistingTools = (prev.existingTools || []).map((existing) => {
          if ((existing.id && update.id === existing.id) || update.slug === existing.slug) {
            const copy = { ...existing };
            if (update.replaceLogo && update.newLogo) copy.logoImageUrl = update.newLogo;
            if (update.replaceBanner && update.newBanner) copy.bannerImageUrl = update.newBanner;
            return copy;
          }
          return existing;
        });

        const updatedImageUpdates = (prev.imageUpdates || [])
          .map((item) => {
            if (item.slug === tool.slug || (item.id && item.id === tool.id)) {
              const copy = { ...item };
              if (update.replaceLogo) {
                copy.currentLogo = update.newLogo;
                copy.hasLogoChange = false;
              }
              if (update.replaceBanner) {
                copy.currentBanner = update.newBanner;
                copy.hasBannerChange = false;
              }
              return copy;
            }
            return item;
          })
          .filter((t) => t.hasLogoChange || t.hasBannerChange);

        return {
          ...prev,
          conflictRecords: updatedConflictRecords,
          existingTools: updatedExistingTools,
          imageUpdates: updatedImageUpdates,
        };
      });

      setMessage(result.message || `Saved image for ${tool.name}. Review blocks preserved.`);
      setSelectedImages((prev) => {
        const next = { ...prev };
        delete next[tool.slug];
        return next;
      });

      if (typeof onImagesUpdated === 'function') {
        onImagesUpdated();
      }
    } catch (error) {
      console.error('Single image update error:', error);
      setErrors([`Failed to update image for ${tool.name}. Please try again.`]);
    } finally {
      setUpdatingImages(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(SCHEMA_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const summary = classification?.summary;
  const conflictRecords = classification?.conflictRecords || [];
  const unresolvedConflicts = conflictRecords.filter((conflict) => !decisions[conflict.recordIndex]);

  function setConflictAction(recordIndex, action) {
    setDecisions((current) => ({
      ...current,
      [recordIndex]: {
        ...(current[recordIndex] || {}),
        action,
      },
    }));
  }

  function setManualField(recordIndex, field, source) {
    setDecisions((current) => ({
      ...current,
      [recordIndex]: {
        ...(current[recordIndex] || { action: 'manual-merge', fields: {} }),
        action: 'manual-merge',
        fields: { ...(current[recordIndex]?.fields || {}), [field]: source },
      },
    }));
  }

  const currentStep = message && message.startsWith('Import complete')
    ? 5
    : classification?.preview
    ? 4
    : loading
    ? 2
    : records.length > 0
    ? 3
    : 1;

  return (
    <section className={styles.importer}>
      <div className={styles.importHeader}>
        <div>
          <h2>Bulk JSON Catalog Import</h2>
          <p>Match by stable ID first, then slug. Existing metadata is updated safely without changing saved tools, reviews, upvotes, or analytics.</p>
        </div>
        <button type="button" onClick={() => setShowPrompt(true)} className={styles.helpButton}>
          <FiDownload /> JSON prompt
        </button>
      </div>

      {/* Restored session banner */}
      {isRestoredSession && (
        <div className={styles.sessionNotice}>
          <span>Active import review session was restored. You can continue reviewing or start fresh.</span>
          <button type="button" onClick={clearSession}>Clear Session & Start Fresh</button>
        </div>
      )}

      {/* 5-Step Safe Flow Indicator */}
      <div className={styles.stepsBar} aria-label="JSON Import Progress Steps">
        <div className={`${styles.stepItem} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 1 ? '✓' : '1'}</span>
          <span>1. Upload</span>
        </div>
        <span className={styles.stepDivider}>→</span>
        <div className={`${styles.stepItem} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 2 ? '✓' : '2'}</span>
          <span>2. Validate</span>
        </div>
        <span className={styles.stepDivider}>→</span>
        <div className={`${styles.stepItem} ${currentStep === 3 ? styles.stepActive : currentStep > 3 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 3 ? '✓' : '3'}</span>
          <span>3. Preview</span>
        </div>
        <span className={styles.stepDivider}>→</span>
        <div className={`${styles.stepItem} ${currentStep === 4 ? styles.stepActive : currentStep > 4 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>{currentStep > 4 ? '✓' : '4'}</span>
          <span>4. Detect New / Existing</span>
        </div>
        <span className={styles.stepDivider}>→</span>
        <div className={`${styles.stepItem} ${currentStep === 5 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>5</span>
          <span>5. Confirm & Import</span>
        </div>
      </div>

      <div className={styles.supportedCategories}>
        <strong>Supported categories</strong>
        <span>{categories.map((category) => `${category.name} (${category.slug})`).join('  |  ')}</span>
      </div>

      <div className={styles.sources}>
        <div className={styles.source}>
          <h3>Upload JSON</h3>
          <label className={styles.upload}>
            <FiUpload />
            <span>{loading ? 'Working...' : 'Choose a JSON file'}</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => event.target.files?.[0] && previewFile(event.target.files[0])}
              disabled={loading}
            />
          </label>
        </div>

        <div className={styles.source}>
          <h3>Paste JSON</h3>
          <textarea
            className={styles.paste}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste an array of tool objects..."
            disabled={Boolean(loading)}
            suppressHydrationWarning
          />
          <button
            type="button"
            className={styles.validatePaste}
            onClick={() => preview(text)}
            disabled={Boolean(loading || !text.trim())}
            suppressHydrationWarning
          >
            <FiCheck /> Preview changes
          </button>
        </div>
      </div>

      {message && <p className={styles.success}><FiCheck /> {message}</p>}
      
      {errors.length > 0 && (
        <div className={styles.errors}>
          <strong>Import blocked:</strong>
          <ul>
            {errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
          </ul>
        </div>
      )}

      {classification?.invalidRecords?.length > 0 && (
        <div className={styles.invalidDetails}>
          <strong>Invalid tools and field errors</strong>
          {classification.invalidRecords.map((item) => (
            <div key={item.recordIndex} className={styles.invalidRecord}>
              <strong>{item.record?.name || `Record ${item.recordIndex + 1}`}</strong>
              <ul>
                {item.details?.map((detail) => (
                  <li key={`${item.recordIndex}-${detail.field}-${detail.code}`}>
                    <b>{detail.field || 'record'}</b>: {detail.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className={styles.summary}>
          <div><strong>{summary.added}</strong><span>Added</span></div>
          <div><strong>{summary.updated || 0}</strong><span>Updated / merged</span></div>
          <div><strong>{summary.conflicts || 0}</strong><span>Conflicts</span></div>
          <div><strong>{summary.skipped || 0}</strong><span>Skipped</span></div>
          <div><strong>{summary.invalid || 0}</strong><span>Invalid</span></div>
          <div><strong>{summary.duplicates || 0}</strong><span>Duplicates</span></div>
        </div>
      )}

      {conflictRecords.length > 0 && (
        <div className={styles.conflictReview}>
          <div className={styles.previewHeader}>
            <strong>Conflict Review ({conflictRecords.length})</strong>
            <span>{unresolvedConflicts.length} decision{unresolvedConflicts.length === 1 ? '' : 's'} remaining</span>
          </div>
          {conflictRecords.map((conflict) => {
            const decision = decisions[conflict.recordIndex];
            const fields = getToolComparisonFields(conflict.existing, conflict.record);
            return (
              <div key={conflict.recordIndex} className={styles.conflictReviewCard}>
                <div className={styles.conflictReviewHeader}>
                  <div><strong>{conflict.record?.name || 'Unnamed tool'}</strong><small>Matched by {conflict.matchedBy}</small></div>
                  <select value={decision?.action || ''} onChange={(event) => setConflictAction(conflict.recordIndex, event.target.value)}>
                    <option value="">Choose action...</option>
                    <option value="keep-existing">Keep Existing</option>
                    <option value="use-new">Use New</option>
                    <option value="skip">Skip</option>
                    <option value="manual-merge">Manual Merge</option>
                  </select>
                </div>
                <div className={styles.conflictColumns}>
                  <div className={styles.conflictComparison} role="table" aria-label="Existing and new tool fields">
                    <div className={styles.conflictColumnHeaders} role="row">
                      <strong role="columnheader">Field</strong>
                      <strong role="columnheader">Existing</strong>
                      <strong role="columnheader">New</strong>
                    </div>
                    {fields.map((field) => {
                      const isImageField = field === 'logoImageUrl' || field === 'bannerImageUrl';
                      const imageType = field === 'bannerImageUrl' ? 'banner' : 'logo';

                      return (
                        <div className={styles.conflictFieldRow} role="row" key={field}>
                          <b role="rowheader">{field}</b>
                          {isImageField ? (
                            <div role="cell" className={styles.imageCell}>
                              <ToolImageStatus
                                url={conflict.existing?.[field]}
                                type={imageType}
                                alt={`${conflict.record?.name || 'Tool'} existing ${imageType}`}
                                showBadge
                                showUrl
                                onEdit={() =>
                                  openImageEditor({
                                    recordIndex: conflict.recordIndex,
                                    toolId: conflict.existing?.id || conflict.record?.id,
                                    toolName: conflict.record?.name || conflict.existing?.name || 'Tool',
                                    toolSlug: conflict.existing?.slug || conflict.record?.slug,
                                    side: 'existing',
                                    field,
                                    initialUrl: conflict.existing?.[field],
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <span role="cell">{formatToolComparisonValue(conflict.existing, field)}</span>
                          )}
                          <div className={styles.conflictNewValue} role="cell">
                            {isImageField ? (
                              <div className={styles.imageCell}>
                                <ToolImageStatus
                                  url={conflict.record?.[field]}
                                  type={imageType}
                                  alt={`${conflict.record?.name || 'Tool'} new ${imageType}`}
                                  showBadge
                                  showUrl
                                  onEdit={() =>
                                    openImageEditor({
                                      recordIndex: conflict.recordIndex,
                                      toolId: conflict.record?.id || conflict.existing?.id,
                                      toolName: conflict.record?.name || conflict.existing?.name || 'Tool',
                                      toolSlug: conflict.record?.slug || conflict.existing?.slug,
                                      side: 'new',
                                      field,
                                      initialUrl: conflict.record?.[field],
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <span>{formatToolComparisonValue(conflict.record, field)}</span>
                            )}
                            {decision?.action === 'manual-merge' && (
                              <select
                                value={decision.fields?.[field] || 'existing'}
                                onChange={(event) => setManualField(conflict.recordIndex, field, event.target.value)}
                                aria-label={`Merge choice for ${field}`}
                              >
                                <option value="existing">Keep existing</option>
                                <option value="new">Use new</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image update indicator */}
      {imageUpdates.length > 0 && (
        <div className={styles.imageAlert}>
          <div className={styles.imageAlertInfo}>
            <FiImage className={styles.imageAlertIcon} />
            <span>
              <strong>{imageUpdates.length}</strong> image update{imageUpdates.length === 1 ? '' : 's'} available
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className={styles.reviewImagesButton}
          >
            Review Images
          </button>
        </div>
      )}

      {classification?.preview && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <strong>Ready to apply changes safely:</strong>
            <button type="button" onClick={apply} disabled={loading || unresolvedConflicts.length > 0} className={styles.confirm}>
              {loading ? 'Importing...' : 'Confirm & Apply Changes'}
            </button>
          </div>
          <div className={styles.previewList}>
            <div className={styles.previewRow}><span>Added (New Tools)</span><small>{classification.preview.added.length}</small></div>
            <div className={styles.previewRow}><span>Conflict Review</span><small>{classification.preview.conflicts.length}</small></div>
            <div className={styles.previewRow}><span>Duplicate Upload Records</span><small>{classification.preview.duplicates.length}</small></div>
            <div className={styles.previewRow}><span>Invalid Records</span><small>{classification.preview.invalid.length}</small></div>
            {records.map((record) => (
              <div key={`${record.id || ''}-${record.slug}`} className={styles.previewRow}>
                <span>{record.name}</span>
                <small>{record.category} / {record.slug}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Review Modal */}
      {showImageModal && imageUpdates.length > 0 && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.imageModal}`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Review Image Updates</h2>
                <p className={styles.modalSub}>
                  Choose which tool logo or banner images to replace. Broken images are automatically disabled. You can also customize or fix image URLs before saving.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImages({});
                }}
                className={styles.closeBtn}
              >
                <FiX />
              </button>
            </div>

            <div className={styles.imageList}>
              {imageUpdates.map((tool) => {
                const selection = selectedImages[tool.slug] || { replaceLogo: false, replaceBanner: false };
                const effectiveNewLogo = customImages[tool.slug]?.logo !== undefined
                  ? customImages[tool.slug].logo
                  : tool.newLogo;
                const effectiveNewBanner = customImages[tool.slug]?.banner !== undefined
                  ? customImages[tool.slug].banner
                  : tool.newBanner;

                const isLogoBroken = Boolean(brokenImages[`${tool.slug}-logo`]);
                const isBannerBroken = Boolean(brokenImages[`${tool.slug}-banner`]);

                return (
                  <div key={tool.slug} className={styles.toolImageCard}>
                    <div className={styles.toolCardHeader}>
                      <div>
                        <strong>{tool.name}</strong>
                        <small>{tool.category} / {tool.slug}</small>
                      </div>
                      <button
                        type="button"
                        className={styles.singleSaveBtn}
                        onClick={() => saveSingleToolImage(tool)}
                        disabled={updatingImages || (
                          (!tool.hasLogoChange || !effectiveNewLogo || isLogoBroken) &&
                          (!tool.hasBannerChange || !effectiveNewBanner || isBannerBroken)
                        )}
                      >
                        Save Image
                      </button>
                    </div>

                    <div className={styles.imageComparisons}>
                      {/* Logo comparison */}
                      {tool.hasLogoChange && (
                        <div className={styles.comparisonItem}>
                          <div className={styles.comparisonHeader}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(selection.replaceLogo && !isLogoBroken)}
                                disabled={isLogoBroken || updatingImages || !effectiveNewLogo}
                                onChange={(e) =>
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceLogo: e.target.checked,
                                    },
                                  }))
                                }
                              />
                              <span>Replace Logo</span>
                            </label>
                            {isLogoBroken && <span className={styles.brokenBadge}>Invalid / Broken URL</span>}
                          </div>
                          <div className={styles.previewPair}>
                            <div className={styles.previewBox}>
                              <span>Current</span>
                              <ToolImageStatus
                                url={tool.currentLogo}
                                type="logo"
                                alt={`${tool.name} current logo`}
                                showBadge
                              />
                            </div>
                            <div className={styles.arrowIcon}>→</div>
                            <div className={styles.previewBox}>
                              <span>New</span>
                              <ToolImageStatus
                                url={effectiveNewLogo}
                                type="logo"
                                alt={`${tool.name} new logo`}
                                showBadge
                                onStatusChange={(newStatus) => {
                                  const broken = newStatus === IMAGE_STATUS.BROKEN || newStatus === IMAGE_STATUS.MISSING;
                                  setBrokenImages((prev) => ({
                                    ...prev,
                                    [`${tool.slug}-logo`]: broken,
                                  }));
                                  if (broken) {
                                    setSelectedImages((prev) => ({
                                      ...prev,
                                      [tool.slug]: {
                                        ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                        replaceLogo: false,
                                      },
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className={styles.replacementInputWrapper}>
                            <label htmlFor={`custom-logo-${tool.slug}`}>Edit Replacement Logo URL:</label>
                            <input
                              id={`custom-logo-${tool.slug}`}
                              type="url"
                              className={styles.replacementUrlInput}
                              value={effectiveNewLogo || ''}
                              placeholder="https://..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomImages((prev) => ({
                                  ...prev,
                                  [tool.slug]: {
                                    ...(prev[tool.slug] || {}),
                                    logo: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Banner comparison */}
                      {tool.hasBannerChange && (
                        <div className={styles.comparisonItem}>
                          <div className={styles.comparisonHeader}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={Boolean(selection.replaceBanner && !isBannerBroken)}
                                disabled={isBannerBroken || updatingImages || !effectiveNewBanner}
                                onChange={(e) =>
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceBanner: e.target.checked,
                                    },
                                  }))
                                }
                              />
                              <span>Replace Banner</span>
                            </label>
                            {isBannerBroken && <span className={styles.brokenBadge}>Invalid / Broken URL</span>}
                          </div>
                          <div className={styles.previewPair}>
                            <div className={styles.previewBox}>
                              <span>Current</span>
                              <ToolImageStatus
                                url={tool.currentBanner}
                                type="banner"
                                alt={`${tool.name} current banner`}
                                showBadge
                              />
                            </div>
                            <div className={styles.arrowIcon}>→</div>
                            <div className={styles.previewBox}>
                              <span>New</span>
                              <ToolImageStatus
                                url={effectiveNewBanner}
                                type="banner"
                                alt={`${tool.name} new banner`}
                                showBadge
                                onStatusChange={(newStatus) => {
                                  const broken = newStatus === IMAGE_STATUS.BROKEN || newStatus === IMAGE_STATUS.MISSING;
                                  setBrokenImages((prev) => ({
                                    ...prev,
                                    [`${tool.slug}-banner`]: broken,
                                  }));
                                  if (broken) {
                                    setSelectedImages((prev) => ({
                                      ...prev,
                                      [tool.slug]: {
                                        ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                        replaceBanner: false,
                                      },
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className={styles.replacementInputWrapper}>
                            <label htmlFor={`custom-banner-${tool.slug}`}>Edit Replacement Banner URL:</label>
                            <input
                              id={`custom-banner-${tool.slug}`}
                              type="url"
                              className={styles.replacementUrlInput}
                              value={effectiveNewBanner || ''}
                              placeholder="https://..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomImages((prev) => ({
                                  ...prev,
                                  [tool.slug]: {
                                    ...(prev[tool.slug] || {}),
                                    banner: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.imageReviewFooter}>
              <div className={styles.imageReviewSummary}>
                <span><strong>{toolsAffectedCount}</strong> Tools affected</span>
                <span><strong>{logosSelectedCount}</strong> Logos selected</span>
                <span><strong>{bannersSelectedCount}</strong> Banners selected</span>
              </div>
              <div className={styles.imageReviewActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedImages({});
                  }}
                  disabled={updatingImages}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyImageUpdates}
                  disabled={updatingImages || (logosSelectedCount === 0 && bannersSelectedCount === 0)}
                  className={styles.confirm}
                >
                  {updatingImages ? 'Updating...' : 'Update Selected Images'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Image Editor Modal */}
      {editingImage && (
        <div
          className={styles.overlay}
          onClick={() => {
            if (!savingEditedImage) setEditingImage(null);
          }}
        >
          <div
            className={`${styles.modal} ${styles.inlineImageEditorModal}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-editor-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="image-editor-title">
                  {editingImage.side === 'existing' ? 'Edit Existing' : 'Edit Incoming'}{' '}
                  {editingImage.field === 'bannerImageUrl' ? 'Banner' : 'Logo'}
                </h2>
                <p className={styles.modalSub}>
                  Tool: <strong>{editingImage.toolName}</strong> ({editingImage.toolSlug}) &bull; ID: <code>{editingImage.toolId || 'N/A'}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                disabled={savingEditedImage}
                className={styles.closeBtn}
                aria-label="Close image editor"
              >
                <FiX />
              </button>
            </div>

            <div className={styles.imageEditorBody}>
              <div className={styles.editorScopeBanner} data-side={editingImage.side}>
                {editingImage.side === 'existing' ? (
                  <span>
                    <strong>Existing Catalog Image:</strong> Saving updates the live catalog record directly without altering your pending import data or other fields.
                  </span>
                ) : (
                  <span>
                    <strong>Incoming Imported Image:</strong> Updates the pending import data. Will be used when you choose <em>Use New</em> or <em>Merge</em>.
                  </span>
                )}
              </div>

              <div className={styles.editorFieldGroup}>
                <div className={styles.editorFieldHeader}>
                  <label htmlFor="editor-url-input">
                    {editingImage.field === 'bannerImageUrl' ? 'Banner' : 'Logo'} Image URL
                  </label>
                  <button
                    type="button"
                    className={styles.clearUrlBtn}
                    onClick={() => setEditorUrl('')}
                    disabled={savingEditedImage || !editorUrl}
                  >
                    Clear URL (No Image)
                  </button>
                </div>
                <input
                  id="editor-url-input"
                  type="url"
                  className={styles.editorInput}
                  value={editorUrl}
                  placeholder="https://example.com/image.png"
                  onChange={(e) => {
                    setEditorUrl(e.target.value);
                    setEditorError('');
                  }}
                  autoFocus
                />
              </div>

              <div className={styles.editorPreviewSection}>
                <strong>Live Validation & Preview:</strong>
                <div className={styles.editorPreviewBox}>
                  <ToolImageStatus
                    url={editorUrl}
                    type={editingImage.field === 'bannerImageUrl' ? 'banner' : 'logo'}
                    alt={`${editingImage.toolName} preview`}
                    showBadge
                    showUrl
                  />
                </div>
              </div>

              {editorError && (
                <div className={styles.editorErrorMsg}>
                  {editorError}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setEditingImage(null)}
                disabled={savingEditedImage}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirm}
                onClick={saveInlineImageEdit}
                disabled={savingEditedImage}
              >
                {savingEditedImage ? 'Saving Image...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrompt && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>JSON generator prompt</h2>
              <button type="button" onClick={() => setShowPrompt(false)}><FiX /></button>
            </div>
            <textarea readOnly value={SCHEMA_PROMPT} />
            <button type="button" className={styles.copy} onClick={copyPrompt}>
              <FiCopy /> {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

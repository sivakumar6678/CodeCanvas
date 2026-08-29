'use client';

import { useState } from 'react';
import { FiCheck, FiCopy, FiDownload, FiImage, FiUpload, FiX } from 'react-icons/fi';
import styles from './ToolJsonImport.module.scss';

const SCHEMA_PROMPT = `Convert this tool list into CodeCraft JSON. Return only a valid JSON array using the canonical schema: id, name, slug, category, subCategory, description, fullOverview, website, logoImageUrl, bannerImageUrl, keyFeatures, pros, cons, pricingModel, platforms, tags, useCases, bestFor, featured, new, verified, hasFree, createdDate. Preserve names and URLs, generate unique string IDs and lowercase hyphenated slugs, use only the supported categories shown in Studio, generate tags, platforms, and useCases only from supplied information, and leave empty optional values instead of inventing facts. Do not use legacy aliases like logo, banner, features, pricing, freeTrial, or platform. Do not auto-copy the logoImageUrl into the bannerImageUrl field.`;

export default function BulkToolJsonImport({ categories, onImportComplete }) {
  const [text, setText] = useState('');
  const [records, setRecords] = useState([]);
  const [classification, setClassification] = useState(null);
  const [mode, setMode] = useState('upsert');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image update workflow state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  const [brokenImages, setBrokenImages] = useState({});
  const [updatingImages, setUpdatingImages] = useState(false);

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
    setSelectedImages({});
    setBrokenImages({});

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
        body: JSON.stringify({ action: 'apply', records, mode })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(result.errors || [result.error || 'Import failed.']);
        return;
      }

      setMessage(`Applied changes: ${result.updated} updated and ${result.imported} added; ${result.skipped || 0} skipped.`);
      setClassification(null);
      setRecords([]);
      setSelectedImages({});

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
          return {
            id: tool.id,
            slug: tool.slug,
            replaceLogo: Boolean(sel.replaceLogo && !brokenImages[`${tool.slug}-logo`]),
            newLogo: tool.newLogo,
            replaceBanner: Boolean(sel.replaceBanner && !brokenImages[`${tool.slug}-banner`]),
            newBanner: tool.newBanner,
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

      setMessage(result.message || `Updated ${result.updatedLogos || 0} logos and ${result.updatedBanners || 0} banners.`);
      setShowImageModal(false);
      setSelectedImages({});

      if (typeof onImportComplete === 'function') {
        onImportComplete();
      }
    } catch (error) {
      console.error('Image update error:', error);
      setErrors(['Failed to update selected images. Please try again.']);
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

  return (
    <section className={styles.importer}>
      <div className={styles.importHeader}>
        <div>
          <h2>Bulk JSON update</h2>
          <p>Match by stable ID first, then slug. Existing metadata is updated in JSON without changing saved tools, reviews, or analytics.</p>
        </div>
        <button type="button" onClick={() => setShowPrompt(true)} className={styles.helpButton}>
          <FiDownload /> JSON prompt
        </button>
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

      <div className={styles.modeRow}>
        <strong>Bulk action</strong>
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="upsert">Update + Import All</option>
          <option value="update-existing">Update All Existing</option>
          <option value="import-new">Import All New</option>
        </select>
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

      {summary && (
        <div className={styles.summary}>
          <div><strong>{summary.existing}</strong><span>Existing</span></div>
          <div><strong>{summary.new}</strong><span>New</span></div>
          <div><strong>{summary.invalid}</strong><span>Invalid</span></div>
          <div><strong>{summary.conflicts}</strong><span>Conflicts</span></div>
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
            <strong>What will happen</strong>
            <button type="button" onClick={apply} disabled={loading} className={styles.confirm}>
              Apply changes
            </button>
          </div>
          <div className={styles.previewList}>
            <div className={styles.previewRow}><span>Added</span><small>{classification.preview.added.length}</small></div>
            <div className={styles.previewRow}><span>Updated</span><small>{classification.preview.updated.length}</small></div>
            <div className={styles.previewRow}><span>Skipped</span><small>{classification.preview.skipped.length}</small></div>
            <div className={styles.previewRow}><span>Invalid</span><small>{classification.preview.invalid.length}</small></div>
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
                  Choose which tool logo or banner images to replace. Broken images are automatically disabled.
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
                const isLogoBroken = Boolean(brokenImages[`${tool.slug}-logo`]);
                const isBannerBroken = Boolean(brokenImages[`${tool.slug}-banner`]);

                return (
                  <div key={tool.slug} className={styles.toolImageCard}>
                    <div className={styles.toolCardHeader}>
                      <strong>{tool.name}</strong>
                      <small>{tool.category} / {tool.slug}</small>
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
                                disabled={isLogoBroken || updatingImages}
                                onChange={(e) =>
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceLogo: e.target.checked
                                    }
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
                              {tool.currentLogo ? (
                                <img src={tool.currentLogo} alt={`${tool.name} current logo`} className={styles.logoThumb} />
                              ) : (
                                <div className={styles.noImage}>No logo</div>
                              )}
                            </div>
                            <div className={styles.arrowIcon}>→</div>
                            <div className={styles.previewBox}>
                              <span>New</span>
                              <img
                                src={tool.newLogo}
                                alt={`${tool.name} new logo`}
                                className={`${styles.logoThumb} ${isLogoBroken ? styles.imgBroken : ''}`}
                                onError={() => {
                                  setBrokenImages((prev) => ({ ...prev, [`${tool.slug}-logo`]: true }));
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceLogo: false
                                    }
                                  }));
                                }}
                              />
                            </div>
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
                                disabled={isBannerBroken || updatingImages}
                                onChange={(e) =>
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceBanner: e.target.checked
                                    }
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
                              {tool.currentBanner ? (
                                <img src={tool.currentBanner} alt={`${tool.name} current banner`} className={styles.bannerThumb} />
                              ) : (
                                <div className={styles.noImage}>No banner</div>
                              )}
                            </div>
                            <div className={styles.arrowIcon}>→</div>
                            <div className={styles.previewBox}>
                              <span>New</span>
                              <img
                                src={tool.newBanner}
                                alt={`${tool.name} new banner`}
                                className={`${styles.bannerThumb} ${isBannerBroken ? styles.imgBroken : ''}`}
                                onError={() => {
                                  setBrokenImages((prev) => ({ ...prev, [`${tool.slug}-banner`]: true }));
                                  setSelectedImages((prev) => ({
                                    ...prev,
                                    [tool.slug]: {
                                      ...(prev[tool.slug] || { replaceLogo: false, replaceBanner: false }),
                                      replaceBanner: false
                                    }
                                  }));
                                }}
                              />
                            </div>
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

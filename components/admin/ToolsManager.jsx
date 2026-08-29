'use client';
import { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import styles from './ToolsManager.module.scss';
import ToolJsonImport from './BulkToolJsonImport';
import { toolToFormState, formStateToTool } from '../../lib/canonical-tool-schema';

export default function ToolsManager({ initialTools, categories }) {
  const [tools, setTools] = useState(initialTools);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const refreshCatalog = async () => {
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTools(data);
        }
      }
    } catch (e) {
      console.error('Failed to refresh tools catalog:', e);
    }
  };

  const openNewModal = () => {
    setCurrentTool(toolToFormState(null, categories));
    setIsModalOpen(true);
  };

  const openEditModal = (tool) => {
    setCurrentTool(toolToFormState(tool, categories));
    setIsModalOpen(true);
  };

  const handleDelete = async (slug, category) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/tools?slug=${encodeURIComponent(slug)}&category=${encodeURIComponent(category)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTools(tools.filter(t => t.slug !== slug));
        setFeedback({ type: 'success', message: 'Tool deleted successfully.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: payload.error || 'Failed to delete tool.' });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'Unable to reach the admin API.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const isEdit = Boolean(currentTool.id);
    const oldSlug = currentTool.originalSlug || currentTool.slug;
    const oldCategory = currentTool.originalCategory || currentTool.category;
    const url = isEdit 
      ? `/api/admin/tools?oldSlug=${encodeURIComponent(oldSlug)}&oldCategory=${encodeURIComponent(oldCategory)}`
      : '/api/admin/tools';
    
    const payload = formStateToTool(currentTool);

    // Clean up undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const { tool } = await res.json();
        if (isEdit) {
          setTools(tools.map(t => (t.slug === oldSlug || (currentTool.id && t.id === currentTool.id) ? tool : t)));
        } else {
          setTools([...tools, tool]);
        }
        setIsModalOpen(false);
        setFeedback({ type: 'success', message: isEdit ? 'Tool updated successfully.' : 'Tool added successfully.' });
      } else {
        const payloadErr = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: payloadErr.error || 'Failed to save tool.' });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Unable to reach the admin API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Catalog management</p>
          <h1>AI Tools</h1>
          <p className={styles.description}>Maintain the tools available in the public CodeCraft directory.</p>
        </div>
        <button onClick={openNewModal} className={styles.primaryBtn}>
          <FiPlus /> Add tool
        </button>
      </div>
      <ToolJsonImport categories={categories} onImportComplete={refreshCatalog} />
      {feedback && <div role="status" className={feedback.type === 'error' ? styles.errorMessage : styles.successMessage}>{feedback.message}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map(tool => {
              const logo = tool.logoImageUrl || tool.logo || tool.logoImage;
              const pricing = tool.pricingModel || tool.pricing;
              return (
                <tr key={tool.id || tool.slug}>
                  <td>
                    <div className={styles.toolNameCell}>
                      {logo ? (
                        <img src={logo} alt="" className={styles.tinyLogo} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={styles.tinyLogoPlaceholder} />
                      )}
                      <span>{tool.name}</span>
                    </div>
                  </td>
                  <td style={{textTransform: 'capitalize'}}>{tool.category}</td>
                  <td>{pricing}</td>
                  <td>
                    {tool.featured && <span className={styles.badge}>Featured</span>}
                    {tool.new && <span className={styles.badge}>New</span>}
                    {tool.verified && <span className={styles.badge}>Verified</span>}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => openEditModal(tool)} className={styles.iconBtn} title="Edit"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(tool.slug, tool.category)} className={`${styles.iconBtn} ${styles.danger}`} title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentTool && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentTool.id ? 'Edit Tool' : 'Add New Tool'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><FiX /></button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Tool Name</label>
                  <input required value={currentTool.name || ''} onChange={e => setCurrentTool({...currentTool, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Slug (URL friendly)</label>
                  <input required value={currentTool.slug || ''} onChange={e => setCurrentTool({...currentTool, slug: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select required value={currentTool.category || ''} onChange={e => setCurrentTool({...currentTool, category: e.target.value})}>
                    {categories.map(c => <option key={c.id || c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Sub Category</label>
                  <input value={currentTool.subCategory || ''} onChange={e => setCurrentTool({...currentTool, subCategory: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Website URL</label>
                  <input required type="url" value={currentTool.website || ''} onChange={e => setCurrentTool({...currentTool, website: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Logo Image URL</label>
                  <input value={currentTool.logoImageUrl || ''} onChange={e => setCurrentTool({...currentTool, logoImageUrl: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Banner Image URL</label>
                  <input value={currentTool.bannerImageUrl || ''} onChange={e => setCurrentTool({...currentTool, bannerImageUrl: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Short Description (Card)</label>
                  <textarea required rows={2} value={currentTool.description || ''} onChange={e => setCurrentTool({...currentTool, description: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Full Overview (Markdown supported)</label>
                  <textarea rows={5} value={currentTool.fullOverview || ''} onChange={e => setCurrentTool({...currentTool, fullOverview: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Key Features (One per line)</label>
                  <textarea rows={4} value={currentTool.keyFeatures || ''} onChange={e => setCurrentTool({...currentTool, keyFeatures: e.target.value})} placeholder="Real-time suggestions&#10;Multi-language support" />
                </div>
                <div className={styles.formGroup}>
                  <label>Pros (One per line)</label>
                  <textarea rows={3} value={currentTool.pros || ''} onChange={e => setCurrentTool({...currentTool, pros: e.target.value})} placeholder="Fast&#10;Intuitive" />
                </div>
                <div className={styles.formGroup}>
                  <label>Cons (One per line)</label>
                  <textarea rows={3} value={currentTool.cons || ''} onChange={e => setCurrentTool({...currentTool, cons: e.target.value})} placeholder="Requires subscription" />
                </div>
                <div className={styles.formGroup}>
                  <label>Pricing Model</label>
                  <input value={currentTool.pricingModel || ''} onChange={e => setCurrentTool({...currentTool, pricingModel: e.target.value})} placeholder="e.g. Free, Freemium, Paid" />
                </div>
                <div className={styles.formGroup}>
                  <label>Platforms (comma separated)</label>
                  <input value={currentTool.platforms || ''} onChange={e => setCurrentTool({...currentTool, platforms: e.target.value})} placeholder="Web, Windows, macOS" />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Tags (comma separated)</label>
                  <input value={currentTool.tags || ''} onChange={e => setCurrentTool({...currentTool, tags: e.target.value})} placeholder="AI, Design, Utility" />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Use Cases (one per line)</label>
                  <textarea rows={3} value={currentTool.useCases || ''} onChange={e => setCurrentTool({...currentTool, useCases: e.target.value})} placeholder="Code generation&#10;Refactoring" />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Best For (one per line)</label>
                  <textarea rows={3} value={currentTool.bestFor || ''} onChange={e => setCurrentTool({...currentTool, bestFor: e.target.value})} placeholder="Developers who want fast autocomplete&#10;Teams working on large codebases" />
                </div>
                
                <div className={styles.checkboxGroup}>
                  <label><input type="checkbox" checked={Boolean(currentTool.featured)} onChange={e => setCurrentTool({...currentTool, featured: e.target.checked})} /> Featured</label>
                  <label><input type="checkbox" checked={Boolean(currentTool.new)} onChange={e => setCurrentTool({...currentTool, new: e.target.checked})} /> New Label</label>
                  <label><input type="checkbox" checked={Boolean(currentTool.verified)} onChange={e => setCurrentTool({...currentTool, verified: e.target.checked})} /> Verified</label>
                  <label><input type="checkbox" checked={Boolean(currentTool.hasFree || currentTool.freeTrial)} onChange={e => setCurrentTool({...currentTool, hasFree: e.target.checked, freeTrial: e.target.checked})} /> Has Free Option</label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.secondaryBtn}>Cancel</button>
                <button type="submit" disabled={loading} className={styles.primaryBtn}>
                  {loading ? 'Saving...' : 'Save Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

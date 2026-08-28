'use client';
import { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import styles from './ToolsManager.module.scss';

export default function ToolsManager({ initialTools, categories }) {
  const [tools, setTools] = useState(initialTools);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const emptyTool = {
    name: '', slug: '', logo: '', banner: '', description: '', overview: '', website: '',
    category: categories[0]?.slug || '', subCategory: '', pricing: 'Free',
    freeTrial: false, platform: [], tags: [], features: [], pros: [], cons: [],
    featured: false, new: true, verified: false
  };

  const openNewModal = () => {
    setCurrentTool({ ...emptyTool });
    setIsModalOpen(true);
  };

  const openEditModal = (tool) => {
    setCurrentTool({
      ...tool,
      originalSlug: tool.slug,
      originalCategory: tool.category,
      platform: tool.platform || [],
      tags: tool.tags || [],
    });
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

    const isEdit = !!currentTool.id;
    const url = isEdit 
      ? `/api/admin/tools?oldSlug=${encodeURIComponent(currentTool.originalSlug || currentTool.slug)}&oldCategory=${encodeURIComponent(currentTool.originalCategory || currentTool.category)}`
      : '/api/admin/tools';
    
    // Formatting arrays
    const {
      originalSlug,
      originalCategory,
      ...toolData
    } = currentTool;

    const payload = {
      ...toolData,
      platform: typeof toolData.platform === 'string' ? toolData.platform.split(',').map(s => s.trim()) : toolData.platform,
      tags: typeof toolData.tags === 'string' ? toolData.tags.split(',').map(s => s.trim()) : toolData.tags,
      features: typeof toolData.features === 'string' ? toolData.features.split('\\n').map(s => s.trim()).filter(Boolean) : toolData.features,
      pros: typeof toolData.pros === 'string' ? toolData.pros.split('\\n').map(s => s.trim()).filter(Boolean) : toolData.pros,
      cons: typeof toolData.cons === 'string' ? toolData.cons.split('\\n').map(s => s.trim()).filter(Boolean) : toolData.cons,
    };

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const { tool } = await res.json();
        if (isEdit) {
          const previousSlug = currentTool.originalSlug || currentTool.slug;
          setTools(tools.map(t => t.slug === previousSlug ? tool : t));
        } else {
          setTools([...tools, tool]);
        }
        setIsModalOpen(false);
        setFeedback({ type: 'success', message: isEdit ? 'Tool updated successfully.' : 'Tool added successfully.' });
      } else {
        const payload = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', message: payload.error || 'Failed to save tool.' });
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
            {tools.map(tool => (
              <tr key={tool.id}>
                <td>
                  <div className={styles.toolNameCell}>
                    {tool.logo ? <img src={tool.logo} alt="" className={styles.tinyLogo} loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <div className={styles.tinyLogoPlaceholder} />}
                    <span>{tool.name}</span>
                  </div>
                </td>
                <td style={{textTransform: 'capitalize'}}>{tool.category}</td>
                <td>{tool.pricing}</td>
                <td>
                  {tool.featured && <span className={styles.badge}>Featured</span>}
                  {tool.new && <span className={styles.badge}>New</span>}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => openEditModal(tool)} className={styles.iconBtn} title="Edit"><FiEdit2 /></button>
                    <button onClick={() => handleDelete(tool.slug, tool.category)} className={`${styles.iconBtn} ${styles.danger}`} title="Delete"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
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
                  <input required value={currentTool.name} onChange={e => setCurrentTool({...currentTool, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Slug (URL friendly)</label>
                  <input required value={currentTool.slug} onChange={e => setCurrentTool({...currentTool, slug: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select required value={currentTool.category} onChange={e => setCurrentTool({...currentTool, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Sub Category</label>
                  <input value={currentTool.subCategory} onChange={e => setCurrentTool({...currentTool, subCategory: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Website URL</label>
                  <input required type="url" value={currentTool.website} onChange={e => setCurrentTool({...currentTool, website: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Logo Image URL</label>
                  <input value={currentTool.logo} onChange={e => setCurrentTool({...currentTool, logo: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Banner Image URL</label>
                  <input value={currentTool.banner} onChange={e => setCurrentTool({...currentTool, banner: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Short Description (Card)</label>
                  <textarea required rows={2} value={currentTool.description} onChange={e => setCurrentTool({...currentTool, description: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Full Overview (Markdown supported)</label>
                  <textarea rows={5} value={currentTool.overview} onChange={e => setCurrentTool({...currentTool, overview: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Key Features (One per line)</label>
                  <textarea rows={4} value={Array.isArray(currentTool.features) ? currentTool.features.join('\\n') : currentTool.features} onChange={e => setCurrentTool({...currentTool, features: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Pros (One per line)</label>
                  <textarea rows={3} value={Array.isArray(currentTool.pros) ? currentTool.pros.join('\\n') : currentTool.pros} onChange={e => setCurrentTool({...currentTool, pros: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Cons (One per line)</label>
                  <textarea rows={3} value={Array.isArray(currentTool.cons) ? currentTool.cons.join('\\n') : currentTool.cons} onChange={e => setCurrentTool({...currentTool, cons: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Pricing Model</label>
                  <input value={currentTool.pricing} onChange={e => setCurrentTool({...currentTool, pricing: e.target.value})} placeholder="e.g. Freemium, Paid, Free" />
                </div>
                <div className={styles.formGroup}>
                  <label>Platforms (comma separated)</label>
                  <input value={Array.isArray(currentTool.platform) ? currentTool.platform.join(', ') : currentTool.platform} onChange={e => setCurrentTool({...currentTool, platform: e.target.value})} placeholder="Web, Windows, macOS" />
                </div>
                <div className={styles.formGroup} style={{gridColumn: '1 / -1'}}>
                  <label>Tags (comma separated)</label>
                  <input value={Array.isArray(currentTool.tags) ? currentTool.tags.join(', ') : currentTool.tags} onChange={e => setCurrentTool({...currentTool, tags: e.target.value})} placeholder="AI, Design, Utility" />
                </div>
                
                <div className={styles.checkboxGroup}>
                  <label><input type="checkbox" checked={currentTool.featured} onChange={e => setCurrentTool({...currentTool, featured: e.target.checked})} /> Featured</label>
                  <label><input type="checkbox" checked={currentTool.new} onChange={e => setCurrentTool({...currentTool, new: e.target.checked})} /> New Label</label>
                  <label><input type="checkbox" checked={currentTool.verified} onChange={e => setCurrentTool({...currentTool, verified: e.target.checked})} /> Verified</label>
                  <label><input type="checkbox" checked={currentTool.freeTrial} onChange={e => setCurrentTool({...currentTool, freeTrial: e.target.checked})} /> Has Free Trial</label>
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

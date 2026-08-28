'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiSend } from 'react-icons/fi';
import styles from './ContributionForms.module.scss';

const initialTool = { tool_name: '', website_url: '', category: '', subcategory: '', description: '', pricing: 'Free', tags: '', recommendation_reason: '', display_name: '', is_anonymous: false };
const initialPrompt = { title: '', type: 'prompt', prompt_content: '', ai_model: '', category: '', use_case: '', use_cases: '', tags: '', description: '', display_name: '', is_anonymous: false };

export default function ContributionForms({ categories }) {
  const [type, setType] = useState('tool');
  const [tool, setTool] = useState(initialTool);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [state, setState] = useState({ loading: false, error: '', success: '' });
  const router = useRouter();
  const active = type === 'tool' ? tool : prompt;
  const setActive = type === 'tool' ? setTool : setPrompt;
  const update = (field, value) => setActive((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: '', success: '' });
    const response = await fetch(`/api/contributions/${type === 'tool' ? 'tools' : 'prompts'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(active) });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) { router.push(`/login?next=/contribute`); return; }
    if (!response.ok) { setState({ loading: false, error: payload.error || 'Unable to submit.', success: '' }); return; }
    setState({ loading: false, error: '', success: 'Submitted for review. Thank you for improving the catalog.' });
    setActive(type === 'tool' ? initialTool : initialPrompt);
  }

  return <section className={styles.workspace}><div className={styles.tabs} role="tablist"><button className={type === 'tool' ? styles.activeTab : ''} onClick={() => setType('tool')} role="tab">AI tool</button><button className={type === 'prompt' ? styles.activeTab : ''} onClick={() => setType('prompt')} role="tab">Prompt or trick</button></div><form onSubmit={submit} className={styles.form}><div className={styles.formGrid}>
    {type === 'tool' ? <><Field label="Tool name" name="tool_name" value={active.tool_name} onChange={update} required /><Field label="Website URL" name="website_url" type="url" value={active.website_url} onChange={update} required /><Select label="Category" name="category" value={active.category} onChange={update} options={categories} required /><Field label="Subcategory" name="subcategory" value={active.subcategory} onChange={update} /><Select label="Pricing" name="pricing" value={active.pricing} onChange={update} options={['Free', 'Freemium', 'Paid', 'Contact for pricing']} required /><Field label="Tags" name="tags" value={active.tags} onChange={update} placeholder="coding, research, design" /><Field label="Description" name="description" value={active.description} onChange={update} required wide /><Field label="Why do you recommend it?" name="recommendation_reason" value={active.recommendation_reason} onChange={update} required wide /></> : <><Field label="Title" name="title" value={active.title} onChange={update} required /><Select label="Content type" name="type" value={active.type} onChange={update} options={[{ slug: 'prompt', name: 'Prompt' }, { slug: 'trick', name: 'Trick' }, { slug: 'slash-command', name: 'Slash command' }, { slug: 'technique', name: 'Technique' }]} required /><Field label="AI/model" name="ai_model" value={active.ai_model} onChange={update} placeholder="ChatGPT, Claude, Gemini" required /><Select label="Category" name="category" value={active.category} onChange={update} options={categories} required /><Field label="Use case" name="use_case" value={active.use_case} onChange={update} required /><Field label="Tags" name="tags" value={active.tags} onChange={update} /><Field label="Description" name="description" value={active.description} onChange={update} required wide /><Field label={active.type === 'prompt' ? 'Prompt content' : 'Content'} name="prompt_content" value={active.prompt_content} onChange={update} required wide textarea /></>}
  </div><div className={styles.contributor}><Field label="Suggested by / display name" name="display_name" value={active.display_name} onChange={update} required={!active.is_anonymous} /><label className={styles.checkbox}><input type="checkbox" checked={active.is_anonymous} onChange={(event) => update('is_anonymous', event.target.checked)} /> Submit anonymously</label></div>{state.error && <p className={styles.error}>{state.error}</p>}{state.success && <p className={styles.success}><FiCheck /> {state.success}</p>}<button className={styles.submit} disabled={state.loading}><FiSend /> {state.loading ? 'Submitting...' : 'Submit for review'}</button></form></section>;
}

function Field({ label, name, value, onChange, type = 'text', required, placeholder, wide, textarea }) { const Input = textarea ? 'textarea' : 'input'; return <label className={`${styles.field} ${wide ? styles.wide : ''}`}><span>{label}</span><Input name={name} type={textarea ? undefined : type} value={value} onChange={(event) => onChange(name, event.target.value)} required={required} placeholder={placeholder} rows={textarea ? 8 : undefined} /></label>; }
function Select({ label, name, value, onChange, options, required }) { return <label className={styles.field}><span>{label}</span><select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} required={required}><option value="">Choose...</option>{options.map((option) => <option key={option.slug || option} value={option.slug || option}>{option.name || option}</option>)}</select></label>; }
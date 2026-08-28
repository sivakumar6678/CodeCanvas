'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCopy, FiHeart } from 'react-icons/fi';
import styles from '../../app/prompts/[id]/page.module.scss';

export default function PromptActions({ promptId, content }) { const [saved, setSaved] = useState(false); const [copied, setCopied] = useState(false); const router = useRouter(); async function act(action) { const response = await fetch(`/api/contributions/prompts/${promptId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); if (response.status === 401) { router.push(`/login?next=/prompts/${promptId}`); return; } if (response.ok && action === 'save') setSaved(true); } async function copy() { await navigator.clipboard.writeText(content); setCopied(true); await act('copy'); setTimeout(() => setCopied(false), 1600); } return <div className={styles.actions}><button type="button" onClick={copy}><FiCopy /> {copied ? 'Copied' : 'Copy'}</button><button type="button" className={styles.primary} onClick={() => act(saved ? 'remove' : 'save')}><FiHeart /> {saved ? 'Saved' : 'Save'}</button></div>; }
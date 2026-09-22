'use client';

import { useEffect } from 'react';

export default function TrackKnowledgeView({ id }) {
  useEffect(() => {
    if (!id) return;
    // Fire and forget knowledge view tracking
    fetch(`/api/contributions/prompts/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {});
  }, [id]);

  return null;
}


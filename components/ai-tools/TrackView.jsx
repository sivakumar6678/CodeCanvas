'use client';

import { useEffect } from 'react';

export default function TrackView({ slug }) {
  useEffect(() => {
    if (!slug) return;

    // 1. General telemetry view tracking
    fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {});

    // 2. User history tracking (authenticated only; silent no-op for guests)
    fetch('/api/user/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: slug, tool_type: 'ai_tool' }),
    }).catch(() => {});
  }, [slug]);

  return null;
}

'use client';

import { useEffect } from 'react';

export default function TrackBuiltinToolView({ id }) {
  useEffect(() => {
    if (!id) return;

    // Record user history for built-in developer tool (authenticated only; silent no-op for guests)
    fetch('/api/user/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: id, tool_type: 'builtin_tool' }),
    }).catch(() => {});
  }, [id]);

  return null;
}


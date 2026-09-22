'use client';

import { useEffect } from 'react';

export default function TrackCategoryView({ category }) {
  useEffect(() => {
    if (!category) return;
    // Fire and forget category view tracking
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'category_view',
        entity_type: 'category',
        entity_id: category,
      }),
    }).catch(() => {});
  }, [category]);

  return null;
}


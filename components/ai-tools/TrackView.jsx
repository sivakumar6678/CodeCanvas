'use client';
import { useEffect } from 'react';

export default function TrackView({ slug }) {
  useEffect(() => {
    // Fire and forget view tracking
    fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(err => console.error('Failed to track view', err));
  }, [slug]);

  return null;
}

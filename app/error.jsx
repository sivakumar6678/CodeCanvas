'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, retry }) {
  useEffect(() => {
    console.error('Route rendering failed:', error?.digest || error?.message);
  }, [error]);

  return (
    <section style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <div>
        <h1>Something went wrong</h1>
        <p>Try again, or return to the CodeCanvas home page.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => retry()}>Try again</button>
          <Link href="/">Back to home</Link>
        </div>
      </div>
    </section>
  );
}

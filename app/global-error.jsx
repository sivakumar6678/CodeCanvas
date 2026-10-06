'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, retry }) {
  useEffect(() => {
    console.error('Global rendering failed:', error?.digest || error?.message);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <main>
          <title>Application error | CodeCanvas</title>
          <h1>CodeCanvas is temporarily unavailable</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={() => retry()}>Try again</button>
        </main>
      </body>
    </html>
  );
}

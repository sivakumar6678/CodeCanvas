'use client';

export default function TrackClickLink({ href, slug, className, children }) {
  const handleClick = (e) => {
    // Don't prevent default, just send the tracking request asynchronously
    fetch('/api/track/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(err => console.error('Failed to track click', err));
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={className} 
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

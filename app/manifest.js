export default function manifest() {
  return {
    name: 'CodeCanvas | Your AI & Developer Toolkit',
    short_name: 'CodeCanvas',
    description: 'Discover curated AI tools, developer utilities, and practical AI knowledge.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/assets/codecanvas-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/codecanvas-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

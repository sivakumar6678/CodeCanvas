const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://code-canvas-steel.vercel.app').replace(/\/$/, '');

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/admin/', '/profile/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

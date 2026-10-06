const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://codecraft.dev').replace(/\/$/, '');

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

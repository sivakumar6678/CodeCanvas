import { Inter, Outfit } from 'next/font/google';
import '../app/global.scss';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
  // Prevent layout shift: size-adjust brings fallback metrics close to Inter
  adjustFontFallback: true,
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
  // Prevent layout shift: size-adjust brings fallback metrics close to Outfit
  adjustFontFallback: true,
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://code-canvas-steel.vercel.app').replace(/\/$/, '');

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'CodeCanvas | Your AI & Developer Toolkit',
  description: 'Your AI & Developer Toolkit. Discover. Build. Learn with AI tools, developer utilities, and curated resources.',
  keywords: ['AI', 'Developer Tools', 'Code Generation', 'Design', 'Next.js'],
  icons: {
    icon: [
      { url: '/assets/codecanvas-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/codecanvas-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/assets/codecanvas-icon-192.png',
    apple: [
      { url: '/apple-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    url: siteUrl,
    title: 'CodeCanvas | Your AI & Developer Toolkit',
    description: 'Discover. Build. Learn with AI tools, developer utilities, and curated resources.',
    type: 'website',
  },
};

// Structured data for Agentic Browsing / rich results
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CodeCanvas',
  url: siteUrl,
  description: 'Your AI & Developer Toolkit. Discover. Build. Learn with AI tools, developer utilities, and curated resources.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/tools?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Fonts optimized and self-hosted via next/font/google */}
        {/* Structured data for search engines and Agentic Browsing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <div className="main-page">
          <Navbar />
          <main className="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

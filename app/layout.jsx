import '../app/global.scss';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://codecraft.dev').replace(/\/$/, '');

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
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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

import '../app/global.scss';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'CodeCanvas | Your AI & Developer Toolkit',
  description: 'Your AI & Developer Toolkit. Discover. Build. Learn with AI tools, developer utilities, and curated resources.',
  keywords: ['AI', 'Developer Tools', 'Code Generation', 'Design', 'Next.js'],
  openGraph: {
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

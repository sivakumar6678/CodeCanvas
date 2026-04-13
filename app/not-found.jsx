import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '1.5rem'
    }}>
      <h1 style={{ fontSize: '8rem', margin: 0 }} className="gradient-text">404</h1>
      <h2 style={{ fontSize: '2rem' }}>Oops! Page Not Found</h2>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        The tool or page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/" style={{
        padding: '1rem 2rem',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '50px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '1rem'
      }}>
        Back to Home
      </Link>
    </div>
  );
}

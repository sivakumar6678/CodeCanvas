import Link from 'next/link';
import styles from './page.module.scss';

export const metadata = {
  title: 'Access Denied | CodeCraft',
  description: 'You do not have permission to access this page.',
};

export default function ForbiddenPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>403</span>
        <h1>Access Denied</h1>
        <p>This area is restricted. Sign in with an authorized admin account or return to the main product.</p>
        <div className={styles.actions}>
          <Link href="/login" className="btn-primary">Go to Login</Link>
          <Link href="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

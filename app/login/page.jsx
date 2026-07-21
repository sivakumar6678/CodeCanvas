'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { FiLock, FiMail } from 'react-icons/fi';
import styles from './page.module.scss';

export default function LoginPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '';

  async function handleSubmit(formData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h2>Welcome Back</h2>
          <p>Sign in to access your profile, saved tools, and any permitted workspace areas.</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form action={handleSubmit} className={styles.form}>
          <input type="hidden" name="next" value={nextPath} />
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.icon} />
              <input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.icon} />
              <input id="password" name="password" type="password" required placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

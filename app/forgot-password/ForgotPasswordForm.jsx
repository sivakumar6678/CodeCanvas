'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMail } from 'react-icons/fi';
import { requestPasswordReset } from '../login/actions';
import styles from '../login/page.module.scss';

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(formData) {
    setSending(true);
    setMessage('');
    setError('');

    try {
      const result = await requestPasswordReset(formData);
      if (result?.error) setError(result.error);
      else setMessage(result?.success || 'Check your email for a password reset link.');
    } catch (submitError) {
      console.error('Password reset request failed:', submitError);
      setError('Unable to send a password reset link right now. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h2>Reset your password</h2>
          <p>Enter your account email and we&apos;ll send a secure reset link.</p>
        </div>
        {error && <div className={styles.errorAlert} role="alert">{error}</div>}
        {message && <div className={styles.successAlert} role="status">{message}</div>}
        <form action={submit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.icon} />
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" disabled={sending} />
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={sending}>
            {sending ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
        <Link href="/login" className={styles.forgotPasswordLink}>Back to sign in</Link>
      </div>
    </div>
  );
}

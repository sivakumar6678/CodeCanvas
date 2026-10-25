'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiLock } from 'react-icons/fi';
import { createClient } from '../../lib/supabase/client';
import styles from '../login/page.module.scss';

export default function ResetPasswordForm() {
  const [supabase] = useState(() => createClient());
  const [linkStatus, setLinkStatus] = useState('checking');
  const [linkError, setLinkError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        setLinkStatus('valid');
      } else {
        setLinkError('This password reset link is invalid or has expired. Request a new one.');
        setLinkStatus('invalid');
      }
    }).catch((sessionError) => {
      if (!active) return;
      console.error('Password reset session verification failed:', sessionError);
      setLinkError('Unable to verify this password reset link. Request a new one.');
      setLinkStatus('invalid');
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  async function submit(formData) {
    const password = formData.get('password')?.toString() || '';
    const confirmPassword = formData.get('confirmPassword')?.toString() || '';
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error('[auth] password-reset:update-rejected', {
          code: updateError.code,
          status: updateError.status,
          message: updateError.message,
        });
        setError(updateError.message || 'Unable to update your password.');
      } else {
        setMessage('Your password has been updated. You can now sign in.');
      }
    } catch (updateError) {
      console.error('[auth] password-reset:update-failed', updateError);
      setError('Unable to update your password right now. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h2>Choose a new password</h2>
          <p>Use at least 8 characters.</p>
        </div>
        {linkError && <div className={styles.errorAlert} role="alert">{linkError}</div>}
        {error && <div className={styles.errorAlert} role="alert">{error}</div>}
        {message && <div className={styles.successAlert} role="status">{message}</div>}
        {linkStatus === 'checking' && <p role="status">Verifying your reset link...</p>}
        {linkStatus === 'valid' && !message && (
          <form action={submit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">New password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.icon} />
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} disabled={saving} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm new password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.icon} />
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} disabled={saving} />
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}
        {linkStatus !== 'checking' && <Link href="/login" className={styles.forgotPasswordLink}>{message ? 'Sign in' : 'Back to sign in'}</Link>}
      </div>
    </div>
  );
}

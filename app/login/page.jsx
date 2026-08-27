'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, resendConfirmation, signup } from './actions';
import { FiLock, FiMail } from 'react-icons/fi';
import styles from './page.module.scss';

export default function LoginPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextPath = searchParams.get('next') || '';

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError === 'missing_confirmation_code') {
      setError('The confirmation link is missing or invalid. Please request a new one.');
    } else if (authError === 'confirmation_failed') {
      setError('Email confirmation failed or has expired. Please try signing in again.');
    }
  }, [searchParams]);

  async function handleSubmit(formData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    setIsRedirecting(false);
    let result;
    const submittedEmail = formData.get('email')?.toString().trim() || '';
    try {
      result = await (isSignup ? signup(formData) : login(formData));
    } catch (submitError) {
      console.error('Authentication form failed:', submitError);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setMessage(result.success);
      if (result.redirectTo) {
        setTimeout(() => {
          setIsRedirecting(true);
          router.replace(result.redirectTo);
        }, 1000);
      } else {
        setConfirmationEmail(submittedEmail);
        setLoading(false);
        setTimeout(() => setIsSignup(false), 1000);
      }
    }
  }

  async function handleResendConfirmation() {
    setResending(true);
    const formData = new FormData();
    formData.set('email', confirmationEmail);
    const result = await resendConfirmation(formData);
    setMessage(result?.error || result?.success || null);
    setResending(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h2>{isSignup ? 'Create Your Account' : 'Welcome Back'}</h2>
          <p>{isSignup ? 'Create a CodeCraft profile to save tools and participate in the community.' : 'Sign in to access your profile, saved tools, and any permitted workspace areas.'}</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}
        {message && <div className={styles.successAlert}>
          <span>{message}</span>
          {confirmationEmail && !isSignup && (
            <button type="button" className={styles.resendBtn} onClick={handleResendConfirmation} disabled={resending}>
              {resending ? 'Sending...' : 'Resend confirmation email'}
            </button>
          )}
        </div>}

        <form action={handleSubmit} className={styles.form}>
          <input type="hidden" name="next" value={nextPath} />
          {isSignup && <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <div className={styles.inputWrapper}>
              <input id="username" name="username" type="text" required minLength={2} maxLength={40} placeholder="your username" />
            </div>
          </div>}
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
              <input id="password" name="password" type="password" required minLength={isSignup ? 8 : undefined} placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {isRedirecting ? 'Redirecting...' : loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        <button type="button" className={styles.toggleModeBtn} onClick={() => { setIsSignup(!isSignup); setError(null); setMessage(null); }}>
          {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || 'Unable to update password. Please try requesting a new reset link.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="auth-card__copy">
          🎉 Your password has been successfully reset! You can now access your account with your new credentials.
        </p>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <Link href="/profile" className="btn btn--primary">
            Go to Your Profile
          </Link>
          <Link href="/auth/sign-in" className="btn btn--outline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} style={{ gap: 16 }}>
      <div className="field">
        <label className="field__label" htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          className="input"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          disabled={submitting}
          required
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          className="input"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }}
          disabled={submitting}
          required
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Updating password...' : 'Update password'}
      </button>

      <p className="auth-form__footnote">
        Remembered your password? <Link href="/auth/sign-in">Sign in</Link>
      </p>
    </form>
  );
}

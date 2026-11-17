'use client';

import { useState, type FormEvent } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as { form?: string } | null;

      if (!response.ok) {
        setFormError(data?.form || 'Unable to send reset instructions. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} style={{ gap: 16 }}>
      <div className="field">
        <label className="field__label" htmlFor="reset-email">College email</label>
        <input
          id="reset-email"
          type="email"
          className="input"
          placeholder="you@adypu.edu.in"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError('');
          }}
          disabled={submitting}
          required
        />
      </div>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      {submitted && (
        <p className="form-success" role="status">
          If an account exists for that email, we’ve sent instructions to reset your password.
        </p>
      )}

      <button type="submit" className="btn btn--primary auth-form__submit" disabled={submitting}>
        {submitting ? 'Sending instructions…' : 'Send reset instructions'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/sign-out', { method: 'POST' });
      if (!response.ok) throw new Error('Sign out failed');
      router.replace('/');
      router.refresh();
    } catch {
      setError('Could not sign out. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-signout">
      <button type="button" className="btn btn--outline" onClick={signOut} disabled={submitting}>
        {submitting ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span role="alert" className="form-error">{error}</span>}
    </div>
  );
}

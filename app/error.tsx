'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container page">
      <section className="route-error" role="alert">
        <span className="tag">That didn’t work</span>
        <h1 className="hero__title">We hit a snag.</h1>
        <p className="hero__sub">Your page couldn’t load just now. Try again, or head back to CampusHub.</p>
        <div className="btn-row">
          <Button onClick={reset}>Try again</Button>
          <Link className="btn btn--outline" href="/">Back to home</Link>
        </div>
      </section>
    </main>
  );
}

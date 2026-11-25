import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-brand" aria-label="CampusHub home">
          <span className="tag">UGSOT · ADYPU</span>
          <span className="auth-brand__name">CampusHub</span>
        </Link>
        {children}
      </section>
    </main>
  );
}

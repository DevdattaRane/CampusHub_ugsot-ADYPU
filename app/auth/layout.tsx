import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import LiquidLogo from '@/components/effects/LiquidLogo';
import ShaderBackground from '@/components/effects/ShaderBackground';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <aside className="auth-visual" aria-label="About CampusHub">
          <ShaderBackground variant="mesh" className="auth-visual__surface">
            <div className="auth-visual__content">
              <LiquidLogo size={60} allowShader={false} />
              <p className="mono">UGSOT · ADYPU</p>
              <p className="auth-visual__headline">Build your place on campus.</p>
              <p>Find your people, discover what is happening, and share what you are making.</p>
            </div>
          </ShaderBackground>
        </aside>
        <section className="auth-card">
          <Link href="/" className="auth-brand" aria-label="CampusHub home">
            <span className="tag">UGSOT · ADYPU</span>
            <span className="auth-brand__name">CampusHub</span>
          </Link>
          {children}
        </section>
      </div>
    </main>
  );
}

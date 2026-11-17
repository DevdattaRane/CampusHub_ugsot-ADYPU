'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { mobilePrimaryItems, mobileMoreItems } from './navigation';
import type { CurrentUser } from '@/lib/auth';

type Props = {
  currentUser?: CurrentUser | null;
};

export default function BottomNav({ currentUser }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  useEffect(() => {
    if (!moreOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div
          role="dialog"
          aria-label="More navigation links"
          ref={moreRef}
          style={{
            position: 'fixed',
            bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
            right: 12,
            left: 12,
            maxWidth: 360,
            margin: '0 auto',
            backgroundColor: '#fff',
            border: '2px solid #1a1a1a',
            borderRadius: 4,
            boxShadow: '4px 4px 0 #1a1a1a',
            zIndex: 999,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>
            More Sections
          </div>
          {mobileMoreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 4,
                border: '1.5px solid transparent',
                fontSize: 14,
                fontWeight: 700,
                color: '#1a1a1a',
                textDecoration: 'none',
                backgroundColor: isActive(item.href) ? '#FFE066' : 'transparent',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: 4, paddingTop: 6 }}>
            <Link
              href={currentUser ? '/profile' : '/auth/sign-in'}
              onClick={() => setMoreOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 4,
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>{currentUser ? `👤 ${currentUser.name}` : '🔑 Sign in to CampusHub'}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      <nav aria-label="Mobile navigation" className="bottom-nav">
        {mobilePrimaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bottom-nav__link"
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}

        {/* More Toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="bottom-nav__link"
          aria-expanded={moreOpen}
          style={{
            background: moreOpen ? '#1a1a1a' : 'transparent',
            color: moreOpen ? '#fff' : 'inherit',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 700,
          }}
        >
          {moreOpen ? '✕ Close' : '☰ More'}
        </button>
      </nav>
    </>
  );
}

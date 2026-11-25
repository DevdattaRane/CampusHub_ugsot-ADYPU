'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth';
import { getVisibleSiteNavigationGroups } from './site-navigation';

type Props = {
  open: boolean;
  currentUser: CurrentUser | null;
  onClose: () => void;
};

export default function IndexMenu({ open, currentUser, onClose }: Props) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const groups = getVisibleSiteNavigationGroups(currentUser);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    menuRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = menuRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div ref={menuRef} className="index-menu" role="dialog" aria-modal="true" aria-label="Campus index">
      <div className="index-menu__head">
        <span className="mono">Index</span>
        <button type="button" className="pill-control" onClick={onClose}>Close</button>
      </div>
      <nav aria-label="Campus index links">
        {groups.map((group) => (
          <section key={group.label} className="index-menu__group">
            <h2 className="mono">{group.label}</h2>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={onClose}
              >
                <span className="mono">{String(item.number).padStart(2, '0')}</span>
                {item.label}
              </Link>
            ))}
          </section>
        ))}
      </nav>
    </div>
  );
}

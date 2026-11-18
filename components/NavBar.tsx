'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearchModal from './GlobalSearchModal';
import IndexMenu from './IndexMenu';
import ThemeToggle from './ThemeToggle';
import LiquidLogo from './ui/LiquidLogo';
import type { CurrentUser } from '@/lib/auth';

type Props = {
  currentUser?: CurrentUser | null;
};

export default function NavBar({ currentUser }: Props) {
  const pathname = usePathname();
  const [openIndexPath, setOpenIndexPath] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const indexOpen = openIndexPath === pathname;
  const visibleUnreadCount = currentUser ? unreadCount : 0;
  const headerLinks = [
    { href: '/projects', label: 'Projects' },
    { href: '/events', label: 'Events' },
    { href: '/students', label: 'Students' },
    { href: '/community', label: 'Community' },
  ];

  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (
        event.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      )) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    fetch('/api/notifications')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUser, pathname]);

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="logo" aria-label="UGSOT Campus Hub home">
            <LiquidLogo />
            <span>UGSOT Campus Hub</span>
          </Link>
          <nav className="topbar-links" aria-label="Featured sections">
            {headerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="topbar__actions" aria-label="Main navigation">
            <button type="button" className="topbar-search" onClick={() => setSearchOpen(true)}>
              Search <kbd>⌘K</kbd>
            </button>
            {currentUser && (
              <Link
                href="/notifications"
                className="topbar-icon topbar-icon--bell"
                aria-label={`Notifications${visibleUnreadCount ? `, ${visibleUnreadCount} unread` : ''}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {visibleUnreadCount > 0 && <span className="notification-count">{visibleUnreadCount}</span>}
              </Link>
            )}
            <ThemeToggle />
            {currentUser ? (
              <Link href="/profile" className="topbar-avatar" aria-label="My profile">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <Link href="/auth/sign-in" className="topbar-signin">Sign in</Link>
            )}
            <button
              type="button"
              className="topbar-index"
              aria-expanded={indexOpen}
              aria-haspopup="dialog"
              onClick={() => setOpenIndexPath(pathname)}
            >
              Index
            </button>
          </nav>
        </div>
      </header>
      <IndexMenu open={indexOpen} currentUser={currentUser ?? null} onClose={() => setOpenIndexPath(null)} />
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

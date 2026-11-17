'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { primaryNavigationItems, moreNavigationItems } from './navigation';
import GlobalSearchModal from './GlobalSearchModal';
import type { CurrentUser } from '@/lib/auth';

type Props = {
  currentUser?: CurrentUser | null;
};

export default function NavBar({ currentUser }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const isMoreActive = moreNavigationItems.some((item) => isActive(item.href));

  // Global keyboard shortcut for search (/ or ⌘K)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Fetch unread notifications count if user is signed in
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
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

  // Handle outside click & escape to close "More" dropdown
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

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMoreOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner" style={{ justifyContent: 'space-between', gap: 12 }}>
          <Link href="/intro" className="logo" aria-label="Open Source Club intro">
            <span aria-hidden="true" className="logo__mark">U</span>
            <span>UGSOT · ADYPU <span className="logo__accent">Hub</span></span>
          </Link>

          <nav aria-label="Main" className="nav" style={{ alignItems: 'center', gap: 6 }}>
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: '#FAF8F5',
                border: '1.5px solid #111',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: '#444',
                marginRight: 4,
              }}
              title="Search CampusHub (Press / or ⌘K)"
            >
              <span>🔍</span>
              <span className="search-text-label" style={{ fontSize: 12 }}>Search...</span>
              <kbd style={{ fontSize: 10, padding: '1px 4px', border: '1px solid #999', borderRadius: 3, backgroundColor: '#eee' }}>⌘K</kbd>
            </button>

            {primaryNavigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav__link"
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}

            {/* More Sections Dropdown */}
            <div style={{ position: 'relative' }} ref={moreRef}>
              <button
                type="button"
                className="nav__link"
                onClick={() => setMoreOpen((prev) => !prev)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  backgroundColor: isMoreActive ? '#FFE14D' : (moreOpen ? '#F6F1E7' : 'transparent'),
                  color: '#111111',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: isMoreActive ? '2px 2px 0 #111' : 'none',
                }}
              >
                <span>More</span>
                <span
                  style={{
                    fontSize: 10,
                    transform: moreOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                    display: 'inline-block',
                  }}
                >
                  ▼
                </span>
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 300,
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #111',
                    borderRadius: 4,
                    boxShadow: '4px 4px 0 #111',
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '4px 8px 6px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#666',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    More Campus Sections
                  </div>

                  {moreNavigationItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 4,
                          backgroundColor: active ? '#FFE14D' : 'transparent',
                          textDecoration: 'none',
                          color: '#111',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{item.description}</div>
                        </div>
                      </Link>
                    );
                  })}

                  {currentUser?.role === 'organizer' && (
                    <Link
                      href="/moderation"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 4,
                        borderTop: '1px dashed #ccc',
                        marginTop: 4,
                        backgroundColor: isActive('/moderation') ? '#FEE2E2' : 'transparent',
                        textDecoration: 'none',
                        color: '#991B1B',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🛡️</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>Moderation Desk</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>Review reports & spam</div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {currentUser && (
              <Link
                href="/notifications"
                title="Notifications"
                aria-label={`Notifications (${unreadCount} unread)`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  border: '2px solid #111',
                  backgroundColor: unreadCount > 0 ? '#FFE14D' : '#fff',
                  boxShadow: '2px 2px 0 #111',
                  position: 'relative',
                  textDecoration: 'none',
                  color: '#111',
                  marginLeft: 4,
                }}
              >
                <span style={{ fontSize: 16 }}>🔔</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#FF5A36',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 900,
                      borderRadius: 10,
                      padding: '1px 5px',
                      border: '1px solid #111',
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profile / Auth Button */}
            {currentUser ? (
              <Link
                href="/profile"
                className="nav__link nav__link--profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: isActive('/profile') ? '#FFE066' : '#fff',
                  border: '2px solid #1a1a1a',
                  borderRadius: 4,
                  padding: '0 12px',
                  color: '#1a1a1a',
                  boxShadow: '2px 2px 0 #1a1a1a',
                  marginLeft: 6,
                }}
                title={`Signed in as ${currentUser.name}`}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    display: 'inline-grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Profile</span>
              </Link>
            ) : (
              <Link
                href="/auth/sign-in"
                className="nav__link nav__link--auth"
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '2px solid #1a1a1a',
                  borderRadius: 4,
                  padding: '0 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: '2px 2px 0 #888',
                  marginLeft: 6,
                }}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

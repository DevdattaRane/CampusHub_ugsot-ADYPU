'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from './navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav aria-label="Mobile" className="bottom-nav">
      {navigationItems.map((item) => (
        <Link key={item.href} href={item.href} className="bottom-nav__link" aria-current={isActive(item.href) ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

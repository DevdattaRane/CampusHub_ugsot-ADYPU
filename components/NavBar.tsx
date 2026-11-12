'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from './navigation';

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="logo">
          <span aria-hidden="true" className="logo__mark">U</span>
          <span>UGSOTADYPU <span className="logo__accent">Hub</span></span>
        </Link>
        <nav aria-label="Main" className="nav">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav__link" aria-current={isActive(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

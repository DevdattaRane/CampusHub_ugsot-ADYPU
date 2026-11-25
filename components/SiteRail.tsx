'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth';
import { getVisibleSiteNavigationGroups } from './site-navigation';

export default function SiteRail({ currentUser }: { currentUser: CurrentUser | null }) {
  const pathname = usePathname();
  const groups = getVisibleSiteNavigationGroups(currentUser);

  return (
    <aside className="site-rail">
      {groups.map((group) => (
        <nav key={group.label} aria-label={group.label} className="site-rail__group">
          <h2 className="mono">{group.label}</h2>
          {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
          ))}
        </nav>
      ))}
    </aside>
  );
}

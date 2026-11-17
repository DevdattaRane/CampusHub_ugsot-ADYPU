import type { CurrentUser } from '@/lib/auth';

export type SiteNavigationItem = {
  href: string;
  label: string;
};

export const siteNavigationGroups: { label: string; items: SiteNavigationItem[] }[] = [
  {
    label: 'Menu',
    items: [
      { href: '/', label: 'Home' },
      { href: '/projects', label: 'Projects' },
      { href: '/events', label: 'Events' },
      { href: '/students', label: 'Students' },
      { href: '/community', label: 'Community' },
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/verify', label: 'Verify certificate' },
    ],
  },
  {
    label: 'More',
    items: [{ href: '/mentorship', label: 'Mentorship' }],
  },
  {
    label: 'Personal',
    items: [
      { href: '/profile', label: 'My profile' },
      { href: '/notifications', label: 'Notifications' },
      { href: '/moderation', label: 'Moderation' },
    ],
  },
];

export function getVisibleSiteNavigationGroups(currentUser: CurrentUser | null) {
  const visibleGroups = siteNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === '/moderation') return currentUser?.role === 'organizer';
        if (item.href === '/profile' || item.href === '/notifications') return Boolean(currentUser);
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  let number = 0;
  return visibleGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      number: ++number,
    })),
  }));
}

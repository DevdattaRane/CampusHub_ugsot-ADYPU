export interface MoreNavigationItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

export const primaryNavigationItems = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/projects', label: 'Projects' },
  { href: '/community', label: 'Forum' },
] as const;

export const moreNavigationItems: MoreNavigationItem[] = [
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: '🏆',
    description: 'Student rankings, activity points & badges',
  },
  {
    href: '/mentorship',
    label: 'Mentorship',
    icon: '🤝',
    description: '1:1 mentor sessions & peer code reviews',
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    icon: '🚀',
    description: 'Internships, hackathons & open source',
  },
  {
    href: '/students',
    label: 'Students',
    icon: '👥',
    description: 'Find teammates & browse student profiles',
  },
  {
    href: '/verify',
    label: 'Verify Certificate',
    icon: '🎓',
    description: 'Validate official event completion certificates',
  },
  {
    href: '/#feature-suggestions',
    label: 'Ideas & Wishlist',
    icon: '💡',
    description: 'Suggest features & vote on campus ideas',
  },
];

// Compatibility exports
export const topNavigationItems = primaryNavigationItems;
export const mobilePrimaryItems = primaryNavigationItems;
export const mobileMoreItems = moreNavigationItems;
export const navigationItems = primaryNavigationItems;


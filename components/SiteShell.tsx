'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { CurrentUser } from '@/lib/auth';
import NavBar from '@/components/NavBar';
import SiteFooter from '@/components/SiteFooter';
import SiteRail from '@/components/SiteRail';
import GlobalMotion from '@/components/GlobalMotion';
import SvgDefs from '@/components/ui/SvgDefs';

type Props = {
  children: ReactNode;
  currentUser: CurrentUser | null;
};

export default function SiteShell({ children, currentUser }: Props) {
  const pathname = usePathname();
  const immersive = pathname.startsWith('/auth/') || pathname === '/intro' || pathname === '/onboarding';

  return (
    <div id="app-content" tabIndex={-1}>
      {!immersive && <NavBar currentUser={currentUser} />}
      <div className={immersive ? 'site-layout site-layout--immersive' : 'site-layout'}>
        {!immersive && <SiteRail currentUser={currentUser} />}
        <div className={immersive ? undefined : 'site-content'}>
          <div id="route-content" className={immersive ? 'route-content route-content--immersive' : 'route-content'}>
            {children}
          </div>
          {!immersive && <SiteFooter />}
        </div>
      </div>
      <SvgDefs />
      <GlobalMotion />
    </div>
  );
}

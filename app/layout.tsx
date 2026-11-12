import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import ProfileFab from '@/components/ProfileFab';
import IntroScreen from '@/components/intro/IntroScreen';
import './globals.css';
import './components.css';
import './phase2.css';
import './intro.css';

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusHub · UGSOT',
  description: 'Events, people and conversations on campus, all in one place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
        <Script id="intro-session-check" strategy="beforeInteractive">
          {`try {
            if (sessionStorage.getItem('campushub-intro-seen') === 'true') {
              document.documentElement.dataset.introSeen = 'true';
            } else {
              sessionStorage.setItem('campushub-intro-seen', 'true');
            }
          } catch (error) {
            console.error('Unable to check the intro session.', error);
          }`}
        </Script>
        <div id="app-content" tabIndex={-1}>
          <NavBar />
          {children}
          <ProfileFab />
          <BottomNav />
        </div>
        <IntroScreen />
      </body>
    </html>
  );
}

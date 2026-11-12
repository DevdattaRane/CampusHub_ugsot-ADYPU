import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Space_Grotesk } from 'next/font/google';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import ProfileFab from '@/components/ProfileFab';
import './globals.css';
import './components.css';

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UGSOTADYPU Hub',
  description: 'Events, people and conversations on campus, all in one place.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
        <NavBar />
        {children}
        <ProfileFab />
        <BottomNav />
      </body>
    </html>
  );
}

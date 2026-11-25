import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import SiteShell from '@/components/SiteShell';
import IntroScreen from '@/components/intro/IntroScreen';
import { getCurrentUser } from '@/lib/auth';
import './components.css';
import './phase2.css';
import './intro.css';
import './auth.css';
import './globals.css';

const inter = Inter({ variable: '--font-dm-sans', subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'] });
const jetBrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusHub · UGSOT',
  description: 'Events, people and conversations on campus, all in one place.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning data-theme="light" data-intro-seen={currentUser ? 'true' : undefined}>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
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
        <SiteShell currentUser={currentUser}>{children}</SiteShell>
        <IntroScreen signedIn={!!currentUser} />
      </body>
    </html>
  );
}

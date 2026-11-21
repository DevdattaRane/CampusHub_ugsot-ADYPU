import type { Metadata } from 'next';
import WelcomeExperience from '@/components/landing/WelcomeExperience';

export const metadata: Metadata = {
  title: 'Welcome · CampusHub · UGSOT',
  description: 'Build, connect, collaborate and grow with UGSOT CampusHub.',
};

export default function WelcomePage() {
  return <WelcomeExperience />;
}

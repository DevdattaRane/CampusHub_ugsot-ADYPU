import type { Metadata } from 'next';
import WelcomeExperience, { type WelcomeEvent } from '@/components/landing/WelcomeExperience';

export const metadata: Metadata = {
  title: 'Welcome · CampusHub · UGSOT',
  description: 'Build, connect, collaborate and grow with UGSOT CampusHub.',
};

export default function WelcomePage() {
  // The current event array is documented as sample data, so don't present it as live.
  const upcomingEvents: WelcomeEvent[] = [];
  return <WelcomeExperience upcomingEvents={upcomingEvents} />;
}

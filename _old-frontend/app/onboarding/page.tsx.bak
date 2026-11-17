import { redirect } from 'next/navigation';
import PageHero from '@/components/PageHero';
import OnboardingView from '@/components/OnboardingView';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Welcome to CampusHub · Student Onboarding',
  description: 'Complete your ADYPU student profile to discover projects, mentors, and hackathon teams.',
};

export default async function OnboardingPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/sign-in');
  }

  return (
    <main className="container page">
      <PageHero
        tag="Student Onboarding · Profile Setup"
        before="Welcome to "
        highlight="CampusHub"
        sub="Tell the community what you are learning, building, and looking to collaborate on."
      />
      <div style={{ marginTop: 24 }}>
        <OnboardingView currentUser={currentUser} />
      </div>
    </main>
  );
}

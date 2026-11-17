import PageHero from '@/components/PageHero';
import OpportunitiesView from '@/components/OpportunitiesView';
import { getCurrentUser } from '@/lib/auth';
import { getOpportunities } from '@/lib/db/opportunities';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tech Opportunities Board · CampusHub · UGSOT' };

export default async function OpportunitiesPage() {
  const currentUser = await getCurrentUser();
  const opportunities = await getOpportunities();

  return (
    <main className="container page page--narrow">
      <PageHero
        tag="Internships · Fellowships · Hackathons · Open Source"
        before="Verified "
        highlight="Opportunities"
        sub="Curated tech internships, open-source programs, fellowships, and campus hackathons in one single board."
      />
      <div style={{ marginTop: 24 }}>
        <OpportunitiesView initialOpportunities={opportunities} currentUser={currentUser} />
      </div>
    </main>
  );
}

import PageHero from '@/components/PageHero';
import CommunityView from '@/components/CommunityView';
import { getCurrentUser } from '@/lib/auth';
import { getCommunityPosts } from '@/lib/db/community';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Community · CampusHub · UGSOT' };

export default async function CommunityPage() {
  const currentUser = await getCurrentUser();
  const initialPosts = await getCommunityPosts();

  return (
    <main className="container page page--narrow">
      <PageHero
        tag="Ask · Discuss · Build"
        before=""
        highlight="Community"
        sub="Ask questions, discuss architectures, share solutions, and stay updated."
      />
      <div style={{ marginTop: 24 }}>
        <CommunityView initialPosts={initialPosts} currentUser={currentUser} />
      </div>
    </main>
  );
}

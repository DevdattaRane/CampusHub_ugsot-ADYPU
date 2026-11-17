import PageHero from '@/components/PageHero';
import ForumView from '@/components/ForumView';
import { getCurrentUser } from '@/lib/auth';
import { getForumPosts } from '@/lib/db/forum';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Developer Forum · CampusHub · UGSOT' };

export default async function CommunityPage() {
  const currentUser = await getCurrentUser();
  const initialPosts = await getForumPosts();

  return (
    <main className="container page page--narrow">
      <PageHero
        tag="Ask · Discuss · Build"
        before="Developer "
        highlight="Community Forum"
        sub="Ask technical questions, discuss architectures, share solutions, and stay updated."
      />
      <div style={{ marginTop: 24 }}>
        <ForumView initialPosts={initialPosts} currentUser={currentUser} />
      </div>
    </main>
  );
}

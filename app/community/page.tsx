import PageHero from '@/components/PageHero';
import CommunityFeed from '@/components/CommunityFeed';
import { posts } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Community · UGSOTADYPU Hub' };

export default function CommunityPage() {
  const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // This route is dynamic so relative post times should use the current request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <main className="container page page--narrow">
      <PageHero
        tag="Ask · Help · Build"
        before="What’s "
        highlight="up"
        after="?"
        sub="Ask questions, get unstuck, and find people to build with."
      />
      <CommunityFeed initialPosts={sorted} now={now} />
    </main>
  );
}

import PageHero from '@/components/PageHero';
import LeaderboardView from '@/components/LeaderboardView';
import { getCurrentUser } from '@/lib/auth';
import {
  getLeaderboardEntries,
  getUserLeaderboardPosition,
  getPointRules,
} from '@/lib/db/leaderboard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Campus Leaderboard · CampusHub · UGSOT',
  description:
    'Track student activity points, top contributors, earned badges, and campus rankings at UGSOT ADYPU.',
};

export default async function LeaderboardPage() {
  const currentUser = await getCurrentUser();
  const initialEntries = await getLeaderboardEntries({
    timeFilter: 'all',
    categoryFilter: 'overall',
    limit: 50,
    offset: 0,
  });

  let initialUserPosition = null;
  if (currentUser?.id) {
    initialUserPosition = await getUserLeaderboardPosition(currentUser.id, 'all', 'overall');
  }

  const pointRules = await getPointRules();

  return (
    <main className="container page">
      <PageHero
        tag="Compete · Contribute · Level Up"
        before="Campus "
        highlight="Leaderboard"
        sub="Earn points and badges by attending events, publishing student projects, solving forum questions, and mentoring peers."
      />
      <div style={{ marginTop: 24 }}>
        <LeaderboardView
          initialEntries={initialEntries}
          initialUserPosition={initialUserPosition}
          currentUserId={currentUser?.id || null}
          isOrganizer={currentUser?.role === 'organizer'}
          pointRules={pointRules}
        />
      </div>
    </main>
  );
}

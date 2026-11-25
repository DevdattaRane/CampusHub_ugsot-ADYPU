import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLeaderboardEntries, getUserLeaderboardPosition } from '@/lib/db/leaderboard';
import type { LeaderboardTimeFilter, LeaderboardCategoryFilter } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = (searchParams.get('time') || 'all') as LeaderboardTimeFilter;
    const categoryFilter = (searchParams.get('category') || 'overall') as LeaderboardCategoryFilter;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const currentUser = await getCurrentUser();
    const entries = await getLeaderboardEntries({
      timeFilter,
      categoryFilter,
      search,
      limit,
      offset,
    });

    let userPosition = null;
    if (currentUser?.id) {
      userPosition = await getUserLeaderboardPosition(currentUser.id, timeFilter, categoryFilter);
    }

    return NextResponse.json({
      entries,
      userPosition,
      currentUserId: currentUser?.id || null,
      isOrganizer: currentUser?.role === 'organizer',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

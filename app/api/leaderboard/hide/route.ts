import { NextResponse } from 'next/server';
import { toggleUserLeaderboardVisibility } from '@/lib/db/leaderboard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, isHidden } = body;

    if (!userId || typeof isHidden !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid parameters.' }, { status: 400 });
    }

    const result = await toggleUserLeaderboardVisibility(userId, isHidden);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update visibility.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, isHidden });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

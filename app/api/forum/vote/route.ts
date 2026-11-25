import { NextResponse } from 'next/server';
import { toggleUpvote } from '@/lib/db/community';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { itemType, itemId } = body as { itemType: 'post' | 'answer'; itemId: string };
    if (!['post', 'answer'].includes(itemType) || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
    }

    const result = await toggleUpvote(itemType, itemId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error toggling upvote:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to upvote' },
      { status: 401 },
    );
  }
}

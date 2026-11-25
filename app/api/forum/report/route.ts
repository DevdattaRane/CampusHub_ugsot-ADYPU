import { NextResponse } from 'next/server';
import { reportForumItem } from '@/lib/db/community';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { itemType, itemId, reason } = body as {
      itemType: 'post' | 'answer';
      itemId: string;
      reason?: string;
    };

    if (!['post', 'answer'].includes(itemType) || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
    }

    await reportForumItem(itemType, itemId, reason);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error reporting item:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to report item' },
      { status: 500 },
    );
  }
}

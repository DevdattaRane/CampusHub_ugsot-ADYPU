import { NextResponse } from 'next/server';
import { createForumAnswer } from '@/lib/db/community';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { postId, content } = body as { postId: string; content: string };
    if (!postId || !content || !content.trim()) {
      return NextResponse.json({ error: 'postId and content are required' }, { status: 400 });
    }

    const answerId = await createForumAnswer(postId, content);
    return NextResponse.json({ success: true, answerId });
  } catch (err) {
    console.error('Error in POST /api/forum/answers:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to submit answer' },
      { status: 500 },
    );
  }
}

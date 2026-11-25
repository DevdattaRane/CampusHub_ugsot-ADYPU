import { NextResponse } from 'next/server';
import { acceptAnswer, deleteForumAnswer } from '@/lib/db/community';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await deleteForumAnswer(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting answer:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete answer' },
      { status: 403 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body: unknown = await request.json().catch(() => null);
    const { postId } = (body || {}) as { postId?: string };
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });

    await acceptAnswer(postId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error accepting answer:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to accept answer' },
      { status: 403 },
    );
  }
}

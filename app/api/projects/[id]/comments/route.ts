import { NextResponse } from 'next/server';
import { addProjectComment, deleteProjectComment } from '@/lib/db/projects';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const content = (body?.content as string) || '';
    if (!content.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const commentId = await addProjectComment(id, content);
    return NextResponse.json({ success: true, commentId });
  } catch (err) {
    console.error('Error adding comment:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add comment' },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('commentId');
  if (!commentId) return NextResponse.json({ error: 'commentId is required' }, { status: 400 });

  try {
    await deleteProjectComment(commentId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete comment' },
      { status: 403 },
    );
  }
}

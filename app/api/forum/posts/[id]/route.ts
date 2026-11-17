import { NextResponse } from 'next/server';
import { deleteForumPost, getForumPostWithAnswers } from '@/lib/db/forum';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const data = await getForumPostWithAnswers(id);
    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching post:', err);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await deleteForumPost(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting post:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete post' },
      { status: 403 },
    );
  }
}

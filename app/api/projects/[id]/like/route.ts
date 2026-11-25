import { NextResponse } from 'next/server';
import { toggleProjectLike } from '@/lib/db/projects';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const result = await toggleProjectLike(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error toggling like:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to like project' },
      { status: 401 },
    );
  }
}

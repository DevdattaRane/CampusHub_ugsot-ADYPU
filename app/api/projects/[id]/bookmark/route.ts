import { NextResponse } from 'next/server';
import { toggleProjectBookmark } from '@/lib/db/projects';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const result = await toggleProjectBookmark(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to bookmark project' },
      { status: 401 },
    );
  }
}

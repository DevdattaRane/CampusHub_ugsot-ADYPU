import { NextResponse } from 'next/server';
import { getDocking } from '@/lib/db/forks';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await getDocking(id, { limit, offset });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch docking students';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

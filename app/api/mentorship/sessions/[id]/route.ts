import { NextResponse } from 'next/server';
import { updateSessionStatus } from '@/lib/db/mentorship';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const { status } = body || {};

    if (!['accepted', 'declined', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    await updateSessionStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating session status:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update session' },
      { status: 403 },
    );
  }
}

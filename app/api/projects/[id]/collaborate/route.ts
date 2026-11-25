import { NextResponse } from 'next/server';
import { sendCollaborationRequest, updateCollaborationStatus } from '@/lib/db/projects';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const { message, roleInterested } = body || {};
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestId = await sendCollaborationRequest(id, message, roleInterested || '');
    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error('Error sending collaboration request:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send collaboration request' },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { requestId, status } = body || {};
    if (!requestId || !['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Valid requestId and status are required' }, { status: 400 });
    }

    await updateCollaborationStatus(requestId, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating collaboration status:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update collaboration status' },
      { status: 403 },
    );
  }
}

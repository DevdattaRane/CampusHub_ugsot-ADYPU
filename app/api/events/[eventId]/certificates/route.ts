import { NextResponse } from 'next/server';
import {
  EventDataError,
  isEventOrganizer,
  issueCertificateForAttendee,
} from '@/lib/db/events';

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const isOrganizer = await isEventOrganizer();
    if (!isOrganizer) {
      return NextResponse.json(
        { error: 'Forbidden: only organizers can issue certificates.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || typeof (body as { userId?: unknown }).userId !== 'string') {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const { userId } = body as { userId: string };
    const certificateId = await issueCertificateForAttendee(eventId, userId);

    return NextResponse.json({ success: true, certificateId });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to issue certificate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue certificate.' },
      { status: 500 },
    );
  }
}

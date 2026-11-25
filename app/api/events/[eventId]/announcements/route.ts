import { NextResponse } from 'next/server';
import { getEvent } from '@/lib/data';
import { EventDataError, postHackathonAnnouncement } from '@/lib/db/events';
import { isStringRecord } from '@/lib/validation';

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  if (getEvent(eventId)?.type !== 'hackathon') {
    return NextResponse.json({ form: 'This hackathon is not available.' }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isStringRecord(body) || !body.message.trim() || body.message.trim().length > 1000) {
    return NextResponse.json(
      { form: 'Write an announcement of 1–1000 characters.' },
      { status: 400 },
    );
  }

  try {
    const announcement = await postHackathonAnnouncement(eventId, body.message);
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    console.error('Unable to post a hackathon announcement.', error);
    return NextResponse.json(
      { form: 'Announcements are temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}

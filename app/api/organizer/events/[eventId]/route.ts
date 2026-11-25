import { NextResponse } from 'next/server';
import {
  NoticeboardEventError,
  parseNoticeboardEventInput,
  updateNoticeboardEvent,
} from '@/lib/db/noticeboard-events';

type RouteContext = { params: Promise<{ eventId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    const { eventId } = await context.params;
    const event = await updateNoticeboardEvent(eventId, parseNoticeboardEventInput(body));
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof NoticeboardEventError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Unable to update organizer event listing.', error);
    return NextResponse.json({ error: 'Unable to save this event listing right now.' }, { status: 500 });
  }
}

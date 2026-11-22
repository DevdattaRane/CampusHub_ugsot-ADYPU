import { NextResponse } from 'next/server';
import {
  createNoticeboardEvent,
  NoticeboardEventError,
  parseNoticeboardEventInput,
} from '@/lib/db/noticeboard-events';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    const event = await createNoticeboardEvent(parseNoticeboardEventInput(body));
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof NoticeboardEventError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Unable to create organizer event listing.', error);
    return NextResponse.json({ error: 'Unable to save this event listing right now.' }, { status: 500 });
  }
}

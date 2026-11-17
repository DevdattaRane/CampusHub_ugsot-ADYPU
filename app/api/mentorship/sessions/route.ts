import { NextResponse } from 'next/server';
import { bookMentorshipSession, getMySessions } from '@/lib/db/mentorship';

export async function GET() {
  try {
    const data = await getMySessions();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { mentorId, date, slot, topic, notes } = body || {};

    if (!mentorId || !date || !slot || !topic) {
      return NextResponse.json(
        { error: 'Mentor, date, slot, and topic are required.' },
        { status: 400 },
      );
    }

    const sessionId = await bookMentorshipSession({
      mentorId,
      date,
      slot,
      topic,
      notes,
    });

    return NextResponse.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error booking session:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to book session' },
      { status: 400 },
    );
  }
}

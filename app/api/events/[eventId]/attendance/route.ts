import { NextResponse } from 'next/server';
import {
  EventDataError,
  getEventAttendanceDetails,
  isEventOrganizer,
  setAttendeeAttendance,
} from '@/lib/db/events';

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const isOrganizer = await isEventOrganizer();
    if (!isOrganizer) {
      return NextResponse.json(
        { error: 'Forbidden: only organizers can view attendance.' },
        { status: 403 },
      );
    }

    const data = await getEventAttendanceDetails(eventId);
    const presentCount = data.records.filter((r) => r.status === 'present').length;
    const totalCount = data.records.length;
    const absentCount = totalCount - presentCount;

    return NextResponse.json({
      event: {
        id: data.event.id,
        title: data.event.title,
        start: data.event.start,
        place: data.event.place,
      },
      counts: {
        total: totalCount,
        present: presentCount,
        absent: absentCount,
      },
      records: data.records,
    });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to get attendance:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attendance details.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const isOrganizer = await isEventOrganizer();
    if (!isOrganizer) {
      return NextResponse.json(
        { error: 'Forbidden: only organizers can update attendance.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    if (
      !body ||
      typeof body !== 'object' ||
      typeof (body as { userId?: unknown }).userId !== 'string' ||
      !['present', 'absent'].includes((body as { status?: unknown }).status as string)
    ) {
      return NextResponse.json(
        { error: 'Invalid payload: userId and status (present | absent) are required.' },
        { status: 400 },
      );
    }

    const { userId, status } = body as { userId: string; status: 'present' | 'absent' };
    await setAttendeeAttendance(eventId, userId, status);

    return NextResponse.json({ success: true, userId, status });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to update attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance record.' },
      { status: 500 },
    );
  }
}

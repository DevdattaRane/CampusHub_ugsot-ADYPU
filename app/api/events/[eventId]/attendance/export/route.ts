import { NextResponse } from 'next/server';
import {
  EventDataError,
  getEventAttendanceDetails,
  isEventOrganizer,
} from '@/lib/db/events';

type RouteContext = { params: Promise<{ eventId: string }> };

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const isOrganizer = await isEventOrganizer();
    if (!isOrganizer) {
      return NextResponse.json(
        { error: 'Forbidden: only organizers can export attendance.' },
        { status: 403 },
      );
    }

    const { event, records } = await getEventAttendanceDetails(eventId);

    const headers = [
      'Event ID',
      'Event Title',
      'Attendee Name',
      'College Email',
      'Course & Year',
      'Registered At',
      'Attendance Status',
      'Attendance Updated At',
    ];

    const rows = records.map((r) => [
      escapeCsvCell(event.id),
      escapeCsvCell(event.title),
      escapeCsvCell(r.name),
      escapeCsvCell(r.email),
      escapeCsvCell(r.courseYear || 'N/A'),
      escapeCsvCell(r.registeredAt),
      escapeCsvCell(r.status.toUpperCase()),
      escapeCsvCell(r.updatedAt || 'N/A'),
    ]);

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((row) => row.join(','))].join(
      '\r\n',
    );

    const filename = `${event.id}-attendance-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to export attendance CSV:', error);
    return NextResponse.json({ error: 'Failed to export attendance.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/db/notifications';

export async function GET() {
  try {
    const preferences = await getNotificationPreferences();
    return NextResponse.json({ preferences });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences payload.' }, { status: 400 });
    }

    const ok = await updateNotificationPreferences(body);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to update preferences.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

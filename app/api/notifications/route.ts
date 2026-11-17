import { NextResponse } from 'next/server';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/db/notifications';

export async function GET() {
  try {
    const notifications = await getMyNotifications();
    const unreadCount = await getUnreadNotificationCount();
    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { action, notificationId } = body || {};

    if (action === 'mark_all_read') {
      const ok = await markAllNotificationsRead();
      return NextResponse.json({ success: ok });
    }

    if (action === 'mark_read' && typeof notificationId === 'string') {
      const ok = await markNotificationRead(notificationId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'Invalid action or parameters.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

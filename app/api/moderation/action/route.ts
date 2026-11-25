import { NextResponse } from 'next/server';
import {
  toggleContentHidden,
  warnUser,
  toggleUserSuspension,
  getModerationLogs,
} from '@/lib/db/moderation';

export async function GET() {
  try {
    const logs = await getModerationLogs();
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { action, targetId, targetType, isHidden, isSuspended, reason } = body || {};

    if (action === 'toggle_hidden') {
      const res = await toggleContentHidden(targetType, targetId, Boolean(isHidden));
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 403 });
      return NextResponse.json({ success: true, isHidden });
    }

    if (action === 'warn_user') {
      const res = await warnUser(targetId, reason || 'Inappropriate community behavior');
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_suspension') {
      const res = await toggleUserSuspension(targetId, Boolean(isSuspended), reason);
      if (!res.success) return NextResponse.json({ error: res.error }, { status: 403 });
      return NextResponse.json({ success: true, isSuspended });
    }

    return NextResponse.json({ error: 'Unrecognized moderation action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

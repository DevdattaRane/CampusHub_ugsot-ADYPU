import { NextResponse } from 'next/server';
import { getReports, submitReport, resolveReport } from '@/lib/db/moderation';
import type { ReportStatus, ReportItemType } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || undefined) as ReportStatus | undefined;

    const reports = await getReports(status);
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { itemType, itemId, reason, details } = body || {};

    if (!itemType || !itemId || !reason) {
      return NextResponse.json({ error: 'Missing required report fields.' }, { status: 400 });
    }

    const result = await submitReport(itemType as ReportItemType, itemId, reason, details);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to submit report.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { reportId, action, resolutionNotes } = body || {};

    if (!reportId || !['dismiss', 'action_taken'].includes(action)) {
      return NextResponse.json({ error: 'Invalid report resolution payload.' }, { status: 400 });
    }

    const result = await resolveReport(reportId, action, resolutionNotes);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to resolve report.' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

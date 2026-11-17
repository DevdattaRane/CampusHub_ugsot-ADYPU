import { NextResponse } from 'next/server';
import { claimCodeReview, resolveCodeReview, submitReviewFeedback } from '@/lib/db/mentorship';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const { action, feedback } = body || {};

    if (action === 'claim') {
      await claimCodeReview(id);
    } else if (action === 'feedback') {
      if (!feedback || !feedback.trim()) {
        return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 });
      }
      await submitReviewFeedback(id, feedback);
    } else if (action === 'resolve') {
      await resolveCodeReview(id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating review:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update review' },
      { status: 403 },
    );
  }
}

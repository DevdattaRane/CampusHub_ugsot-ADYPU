import { NextResponse } from 'next/server';
import { getCodeReviews, requestCodeReview } from '@/lib/db/mentorship';

export async function GET() {
  try {
    const reviews = await getCodeReviews();
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { title, githubUrl, codeSnippet, language, notes } = body || {};

    if (!title || !notes) {
      return NextResponse.json(
        { error: 'Title and notes are required for code review.' },
        { status: 400 },
      );
    }

    const reviewId = await requestCodeReview({
      title,
      githubUrl,
      codeSnippet,
      language: language || 'Other',
      notes,
    });

    return NextResponse.json({ success: true, reviewId });
  } catch (err) {
    console.error('Error requesting code review:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to request review' },
      { status: 500 },
    );
  }
}

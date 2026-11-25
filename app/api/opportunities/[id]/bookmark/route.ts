import { NextResponse } from 'next/server';
import { toggleOpportunityBookmark } from '@/lib/db/opportunities';

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await toggleOpportunityBookmark(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to bookmark.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

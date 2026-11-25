import { NextResponse } from 'next/server';
import { deleteOpportunity, updateOpportunity } from '@/lib/db/opportunities';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    await updateOpportunity(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update opportunity.';
    const status = message.includes('organizer') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteOpportunity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete opportunity.';
    const status = message.includes('organizer') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

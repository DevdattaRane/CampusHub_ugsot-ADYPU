import { NextResponse } from 'next/server';
import { createOpportunity, getOpportunities } from '@/lib/db/opportunities';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const hideExpired = searchParams.get('hideExpired') === 'true';

    const opportunities = await getOpportunities({ category, search, hideExpired });
    return NextResponse.json({ opportunities });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch opportunities.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, organization, category, description, link, deadline, location, eligibility } =
      body;

    if (!title?.trim() || !organization?.trim() || !category || !description?.trim() || !link?.trim() || !deadline) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const id = await createOpportunity({
      title,
      organization,
      category,
      description,
      link,
      deadline,
      location: location || 'Remote',
      eligibility: eligibility || 'All students',
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create opportunity.';
    const status = message.includes('organizer') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

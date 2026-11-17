import { NextResponse } from 'next/server';
import { getEvent } from '@/lib/data';
import { createHackathonTeam, EventDataError } from '@/lib/db/events';

type RouteContext = { params: Promise<{ eventId: string }> };

function isTeamRequest(value: unknown): value is { name: string; memberEmails: string[] } {
  if (typeof value !== 'object' || value === null || !('name' in value) || !('memberEmails' in value)) {
    return false;
  }
  return typeof value.name === 'string'
    && Array.isArray(value.memberEmails)
    && value.memberEmails.every((email: unknown) => typeof email === 'string');
}

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  if (getEvent(eventId)?.type !== 'hackathon') {
    return NextResponse.json({ form: 'This hackathon is not available.' }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isTeamRequest(body)) {
    return NextResponse.json({ form: 'Check the team name and member emails.' }, { status: 400 });
  }
  if (!body.name.trim() || body.name.trim().length > 80) {
    return NextResponse.json({ form: 'Team names must be between 1 and 80 characters.' }, { status: 400 });
  }
  try {
    const teamId = await createHackathonTeam(eventId, body.name, body.memberEmails);
    return NextResponse.json({ teamId }, { status: 201 });
  } catch (error) {
    if (error instanceof EventDataError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    console.error('Unable to create a hackathon team.', error);
    return NextResponse.json(
      { form: 'Team registration is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}

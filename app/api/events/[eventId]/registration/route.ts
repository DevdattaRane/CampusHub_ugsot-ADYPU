import { NextResponse } from 'next/server';
import { getEvent } from '@/lib/data';
import {
  cancelEventRegistration,
  EventRegistrationError,
  registerForEvent,
} from '@/lib/db/events';

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  if (!getEvent(eventId)) {
    return NextResponse.json({ form: 'This event is not available.' }, { status: 404 });
  }

  try {
    const status = await registerForEvent(eventId);
    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof EventRegistrationError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    console.error('Unable to register for an event.', error);
    return NextResponse.json(
      { form: 'Registration is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  if (!getEvent(eventId)) {
    return NextResponse.json({ form: 'This event is not available.' }, { status: 404 });
  }

  try {
    const status = await cancelEventRegistration(eventId);
    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof EventRegistrationError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    console.error('Unable to cancel an event registration.', error);
    return NextResponse.json(
      { form: 'Cancellation is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}

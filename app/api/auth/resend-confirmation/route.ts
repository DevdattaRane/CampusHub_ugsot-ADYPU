import { NextResponse } from 'next/server';
import { resendEmailConfirmation, AuthServiceError } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    await resendEmailConfirmation(email);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to resend confirmation.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

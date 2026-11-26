import { NextResponse } from 'next/server';
import { resendEmailConfirmation, AuthServiceError, getPublicOrigin } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (typeof email !== 'string' || !email.trim() || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const origin = getPublicOrigin(request);
    const emailRedirectTo = `${origin}/auth/callback?next=/onboarding`;
    await resendEmailConfirmation(email, emailRedirectTo);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to resend confirmation.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

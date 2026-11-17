import { NextResponse } from 'next/server';
import { AuthServiceError, requestPasswordReset } from '@/lib/auth';
import { isStringRecord } from '@/lib/validation';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isStringRecord(body) || typeof body.email !== 'string') {
    return NextResponse.json({ form: 'Enter your email address.' }, { status: 400 });
  }

  const email = body.email.trim();
  if (!email) {
    return NextResponse.json({ form: 'Enter your email address.' }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/auth/callback?next=/auth/reset-password`;
    await requestPasswordReset(email, redirectTo);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.startsWith('Supabase is not configured.')) {
      return NextResponse.json({ form: error.message }, { status: 503 });
    }
    console.error('Unable to send password reset with Supabase.', error);
    return NextResponse.json({ form: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

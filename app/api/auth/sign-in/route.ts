import { NextResponse } from 'next/server';
import { AuthServiceError, signIn } from '@/lib/auth';
import { isStringRecord, validateSignIn } from '@/lib/validation';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isStringRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ form: 'Enter your email address and password.' }, { status: 400 });
  }

  const errors = validateSignIn({ email: body.email, password: body.password });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  try {
    await signIn(body.email, body.password);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.startsWith('Supabase is not configured.')) {
      return NextResponse.json({ form: error.message }, { status: 503 });
    }
    console.error('Unable to sign in with Supabase.', error);
    return NextResponse.json({ form: 'Sign-in is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

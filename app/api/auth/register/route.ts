import { NextResponse } from 'next/server';
import { AuthServiceError, signUp } from '@/lib/auth';
import { isStringRecord, validateSignUp } from '@/lib/validation';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isStringRecord(body)) {
    return NextResponse.json({ form: 'Check the details and try again.' }, { status: 400 });
  }
  const { name, email, password, confirmPassword, courseYear } = body;
  if (!name || !email || !password || !confirmPassword || !courseYear) {
    return NextResponse.json({ form: 'Complete each field to create your account.' }, { status: 400 });
  }

  const errors = validateSignUp({ name, email, password, confirmPassword, courseYear });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  try {
    const result = await signUp(name, email, password, courseYear);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.startsWith('Supabase is not configured.')) {
      return NextResponse.json({ form: error.message }, { status: 503 });
    }
    console.error('Unable to register with Supabase.', error);
    return NextResponse.json({ form: 'Registration is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

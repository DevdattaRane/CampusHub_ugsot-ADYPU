import { NextResponse } from 'next/server';
import { updatePassword, AuthServiceError } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const password = body?.password;

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await updatePassword(password);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : 'Failed to update password.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

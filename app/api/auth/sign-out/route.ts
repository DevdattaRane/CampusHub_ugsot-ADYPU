import { NextResponse } from 'next/server';
import { AuthServiceError, signOut } from '@/lib/auth';

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ form: error.message }, { status: error.status });
    }
    console.error('Unable to sign out from Supabase.', error);
    return NextResponse.json({ form: 'Sign out is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

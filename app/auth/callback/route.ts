import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getPublicOrigin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  // Check for error parameters sent by Supabase (e.g. otp_expired, access_denied)
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error || errorCode || errorDescription) {
    const message = errorDescription || error || 'The authentication link is invalid or has expired.';
    const isReset = next.includes('reset-password');
    const destination = new URL(isReset ? '/auth/reset-password' : '/auth/sign-in', origin);
    destination.searchParams.set('error', message);
    return NextResponse.redirect(destination);
  }

  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return NextResponse.redirect(new URL(next, origin));
      }
      console.error('Error exchanging auth code for session:', exchangeError.message);
      const isReset = next.includes('reset-password');
      const destination = new URL(isReset ? '/auth/reset-password' : '/auth/sign-in', origin);
      destination.searchParams.set('error', exchangeError.message || 'The authentication link is invalid or has expired.');
      return NextResponse.redirect(destination);
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      const isReset = next.includes('reset-password');
      const destination = new URL(isReset ? '/auth/reset-password' : '/auth/sign-in', origin);
      destination.searchParams.set('error', 'Authentication failed. Please request a new link.');
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(new URL('/auth/sign-in', origin));
}

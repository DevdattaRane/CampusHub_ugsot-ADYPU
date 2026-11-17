import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
      console.error('Error exchanging auth code for session:', error.message);
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
    }
  }

  return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
}

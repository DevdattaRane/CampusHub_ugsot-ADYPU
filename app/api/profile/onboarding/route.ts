import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { fullName, courseYear, skills, interests, goals, githubUsername, skip } = body || {};

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, simulated: true });
    }

    const supabase = await createSupabaseServerClient();

    const payload: {
      onboarding_completed: boolean;
      updated_at: string;
      full_name?: string;
      course_year?: string;
      skills?: string[];
      interests?: string[];
      goals?: string[];
      github_username?: string | null;
    } = {
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (!skip) {
      if (typeof fullName === 'string' && fullName.trim()) payload.full_name = fullName.trim();
      if (typeof courseYear === 'string' && courseYear.trim()) payload.course_year = courseYear.trim();
      if (Array.isArray(skills)) payload.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      if (Array.isArray(interests)) payload.interests = interests.map((i) => String(i).trim()).filter(Boolean);
      if (Array.isArray(goals)) payload.goals = goals.map((g) => String(g).trim()).filter(Boolean);
      if (typeof githubUsername === 'string') {
        payload.github_username = githubUsername.trim().replace(/^@/, '') || null;
      }
    }

    // Sync to user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          ...(payload.full_name ? { full_name: payload.full_name } : {}),
          ...(payload.course_year ? { course_year: payload.course_year } : {}),
          ...(payload.skills ? { skills: payload.skills } : {}),
          ...(payload.interests ? { interests: payload.interests } : {}),
          ...(payload.goals ? { goals: payload.goals } : {}),
          ...(payload.github_username !== undefined ? { github_username: payload.github_username } : {}),
        },
      });
    } catch {
      // Continue
    }

    // Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', currentUser.id);

    if (error) {
      console.warn(`Profile update warning in onboarding: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

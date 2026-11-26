import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
export * from './auth-helpers';
import { AuthServiceError, type CurrentUser } from './auth-helpers';

export async function signIn(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      throw new AuthServiceError('Please verify your email address before signing in. Check your inbox for the confirmation link.', 400);
    }
    throw new AuthServiceError('Email or password is incorrect. Please try again.', 400);
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  courseYear: string,
  emailRedirectTo?: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: name.trim(), course_year: courseYear },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });
  if (error) {
    const alreadyRegistered = /already (?:been )?registered|already exists/i.test(error.message);
    throw new AuthServiceError(
      alreadyRegistered ? 'An account with this email already exists. Try signing in.' : (error.message || 'We couldn’t create your account. Check your details and try again.'),
      400,
    );
  }
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new AuthServiceError('An account with this email already exists. Try signing in.', 400);
  }
  return { confirmationRequired: data.session === null };
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthServiceError('We couldn’t sign you out. Please try again.', 500);
}

export async function requestPasswordReset(email: string, redirectTo?: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) {
    throw new AuthServiceError('We couldn’t send reset instructions. Check the email and try again.', 400);
  }
}

export async function updatePassword(password: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new AuthServiceError('We couldn’t update your password. Please try again.', 400);
  }
}

export async function resendEmailConfirmation(email: string, emailRedirectTo?: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) {
    throw new AuthServiceError('Unable to resend confirmation email. Please check your email or wait a moment.', 400);
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (authError.status === 401 || authError.name === 'AuthSessionMissingError') return null;
    throw new Error(`Unable to verify the signed-in user: ${authError.message}`);
  }
  if (!authData.user?.email) return null;

  const { data: initialProfile, error } = await supabase
    .from('profiles')
    .select('full_name, role, github_username, skills, bio, course_year, interests, goals, onboarding_completed, is_profile_private, is_suspended, warning_count')
    .eq('id', authData.user.id)
    .maybeSingle();

  let profile = initialProfile;

  // Self-heal profile if trigger did not create it
  if (!profile) {
    const defaultName = authData.user.user_metadata?.full_name || '';
    const defaultCourseYear = authData.user.user_metadata?.course_year || null;
    try {
      const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email.toLowerCase(),
          full_name: defaultName,
          course_year: defaultCourseYear,
          role: 'student',
        })
        .select('full_name, role, github_username, skills, bio, course_year, interests, goals, onboarding_completed, is_profile_private, is_suspended, warning_count')
        .maybeSingle();
      if (!insertError && createdProfile) {
        profile = createdProfile;
      }
    } catch {
      // Ignore self-heal errors, fall back to user metadata below
    }
  }

  if (error && !profile) {
    console.warn(`Unable to load the signed-in profile: ${error.message}`);
  }

  const name = profile?.full_name || authData.user.user_metadata?.full_name;
  return {
    id: authData.user.id,
    name: typeof name === 'string' && name.trim() ? name : authData.user.email.split('@')[0],
    email: authData.user.email,
    role: profile?.role ?? 'student',
    githubUsername: profile?.github_username || authData.user.user_metadata?.github_username || null,
    skills: profile?.skills ?? (Array.isArray(authData.user.user_metadata?.skills) ? authData.user.user_metadata.skills : []),
    bio: profile?.bio || authData.user.user_metadata?.bio || null,
    courseYear: profile?.course_year || authData.user.user_metadata?.course_year || null,
    interests: profile?.interests ?? (Array.isArray(authData.user.user_metadata?.interests) ? authData.user.user_metadata.interests : []),
    goals: profile?.goals ?? (Array.isArray(authData.user.user_metadata?.goals) ? authData.user.user_metadata.goals : []),
    onboardingCompleted: Boolean(profile?.onboarding_completed || authData.user.user_metadata?.onboarding_completed),
    isProfilePrivate: Boolean(profile?.is_profile_private || authData.user.user_metadata?.is_profile_private),
    isSuspended: Boolean(profile?.is_suspended),
    warningCount: Number(profile?.warning_count || 0),
  };
}

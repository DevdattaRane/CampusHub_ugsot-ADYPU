import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserLeaderboardPosition } from '@/lib/db/leaderboard';
import type { Student } from '@/lib/types';
import { students, getStudent } from '@/lib/data';

export type ActivityMonth = {
  month: string; // e.g. 'Nov 2026'
  count: number;
};

export type DashboardStats = {
  projectsCount: number;
  eventsRegisteredCount: number;
  eventsAttendedCount: number;
  certificatesCount: number;
  acceptedAnswersCount: number;
  completedMentorshipCount: number;
  streakDays: number;
  leaderboardRank?: number | null;
  leaderboardPoints?: number | null;
  badges?: string[];
  monthlyActivity: ActivityMonth[];
  githubData: {
    username: string | null;
    avatarUrl: string | null;
    publicRepos: number;
    publicGists: number;
    followers: number;
    recentCommits: number;
    recentEventsCount: number;
    error?: string;
  } | null;
};

// Cache GitHub stats to prevent rate limiting
const GITHUB_CACHE = new Map<
  string,
  { timestamp: number; data: NonNullable<DashboardStats['githubData']> }
>();

async function fetchGitHubUserInsights(
  username: string,
): Promise<NonNullable<DashboardStats['githubData']>> {
  const cleanUser = username.trim().replace(/^@/, '');
  const cached = GITHUB_CACHE.get(cleanUser);
  const now = Date.now();

  if (cached && now - cached.timestamp < 10 * 60 * 1000) {
    return cached.data;
  }

  try {
    const userRes = await fetch(`https://api.github.com/users/${cleanUser}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CampusHub-StudentDashboard',
      },
      next: { revalidate: 600 },
    });

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return {
          username: cleanUser,
          avatarUrl: null,
          publicRepos: 0,
          publicGists: 0,
          followers: 0,
          recentCommits: 0,
          recentEventsCount: 0,
          error: 'GitHub user not found',
        };
      }
      return {
        username: cleanUser,
        avatarUrl: null,
        publicRepos: 0,
        publicGists: 0,
        followers: 0,
        recentCommits: 0,
        recentEventsCount: 0,
        error: 'GitHub API rate limited or temporarily unavailable',
      };
    }

    const userData = await userRes.json();

    // Fetch public events for commit and activity estimation
    let recentCommits = 0;
    let recentEventsCount = 0;

    try {
      const eventsRes = await fetch(`https://api.github.com/users/${cleanUser}/events?per_page=30`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'CampusHub-StudentDashboard',
        },
        next: { revalidate: 600 },
      });

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) {
          recentEventsCount = eventsData.length;
          for (const ev of eventsData) {
            if (ev.type === 'PushEvent' && ev.payload?.commits) {
              recentCommits += ev.payload.commits.length;
            }
          }
        }
      }
    } catch {
      // Continue if events sub-call fails
    }

    const result = {
      username: cleanUser,
      avatarUrl: userData.avatar_url || null,
      publicRepos: userData.public_repos || 0,
      publicGists: userData.public_gists || 0,
      followers: userData.followers || 0,
      recentCommits,
      recentEventsCount,
    };

    GITHUB_CACHE.set(cleanUser, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.error('Error fetching GitHub user info:', err);
    return {
      username: cleanUser,
      avatarUrl: null,
      publicRepos: 0,
      publicGists: 0,
      followers: 0,
      recentCommits: 0,
      recentEventsCount: 0,
      error: 'Could not connect to GitHub API',
    };
  }
}

export async function getUserDashboardData(
  userId: string,
  githubUsername?: string | null,
): Promise<DashboardStats> {
  const fallbackMonths: ActivityMonth[] = [
    { month: 'Jun', count: 4 },
    { month: 'Jul', count: 7 },
    { month: 'Aug', count: 12 },
    { month: 'Sep', count: 9 },
    { month: 'Oct', count: 15 },
    { month: 'Nov', count: 18 },
  ];

  if (!isSupabaseConfigured()) {
    const githubData = githubUsername ? await fetchGitHubUserInsights(githubUsername) : null;
    return {
      projectsCount: 2,
      eventsRegisteredCount: 4,
      eventsAttendedCount: 3,
      certificatesCount: 2,
      acceptedAnswersCount: 3,
      completedMentorshipCount: 1,
      streakDays: 5,
      monthlyActivity: fallbackMonths,
      githubData,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Projects count
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId);

    // 2. Events registered
    const { count: eventsRegisteredCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 3. Events attended
    const { count: eventsAttendedCount } = await supabase
      .from('event_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'present');

    // 4. Certificates earned
    const { count: certificatesCount } = await supabase
      .from('event_certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 5. Accepted community answers (answers by this author that were accepted on questions)
    const { data: userAnswers } = await supabase
      .from('forum_answers')
      .select('id')
      .eq('author_id', userId);

    let acceptedAnswersCount = 0;
    if (userAnswers && userAnswers.length > 0) {
      const answerIds = userAnswers.map((a) => a.id);
      const { count } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .in('accepted_answer_id', answerIds);
      acceptedAnswersCount = count ?? 0;
    }

    // 6. Mentorship sessions
    // Check if user has mentor profile
    const { data: mentorProf } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let completedMentorshipCount = 0;
    const { count: menteeCount } = await supabase
      .from('mentorship_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('mentee_id', userId)
      .eq('status', 'completed');

    completedMentorshipCount += menteeCount ?? 0;

    if (mentorProf) {
      const { count: mentorCount } = await supabase
        .from('mentorship_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorProf.id)
        .eq('status', 'completed');
      completedMentorshipCount += mentorCount ?? 0;
    }

    // 7. GitHub Data
    let githubData: DashboardStats['githubData'] = null;
    if (githubUsername) {
      githubData = await fetchGitHubUserInsights(githubUsername);
    }

    // Compute dynamic monthly activity based on actual stats
    const totalActivity =
      (projectsCount ?? 0) * 3 +
      (eventsAttendedCount ?? 0) * 4 +
      (certificatesCount ?? 0) * 5 +
      (acceptedAnswersCount ?? 0) * 2 +
      completedMentorshipCount * 2 +
      (githubData?.recentEventsCount ?? 0);

    const baseCount = Math.max(2, Math.floor(totalActivity / 6));
    const dynamicMonths: ActivityMonth[] = [
      { month: 'Jun', count: Math.max(1, baseCount - 2) },
      { month: 'Jul', count: Math.max(2, baseCount - 1) },
      { month: 'Aug', count: Math.max(3, baseCount + 1) },
      { month: 'Sep', count: Math.max(2, baseCount) },
      { month: 'Oct', count: Math.max(4, baseCount + 3) },
      { month: 'Nov', count: Math.max(5, totalActivity) },
    ];

    // Compute streak
    const streakDays = Math.min(30, Math.max(1, (eventsAttendedCount ?? 0) * 2 + (projectsCount ?? 0) * 3));

    // Fetch leaderboard rank and badges
    let leaderboardRank: number | null = null;
    let leaderboardPoints: number | null = null;
    let badges: string[] = [];

    try {
      const position = await getUserLeaderboardPosition(userId, 'all', 'overall');
      if (position) {
        leaderboardRank = position.rank;
        leaderboardPoints = position.totalPoints;
        badges = position.badges;
      }
    } catch {
      // Graceful fallback if leaderboard RPC is unconfigured
    }

    return {
      projectsCount: projectsCount ?? 0,
      eventsRegisteredCount: eventsRegisteredCount ?? 0,
      eventsAttendedCount: eventsAttendedCount ?? 0,
      certificatesCount: certificatesCount ?? 0,
      acceptedAnswersCount: acceptedAnswersCount ?? 0,
      completedMentorshipCount,
      streakDays,
      leaderboardRank,
      leaderboardPoints,
      badges,
      monthlyActivity: dynamicMonths,
      githubData,
    };
  } catch (err) {
    console.error('Error computing user dashboard stats:', err);
    return {
      projectsCount: 0,
      eventsRegisteredCount: 0,
      eventsAttendedCount: 0,
      certificatesCount: 0,
      acceptedAnswersCount: 0,
      completedMentorshipCount: 0,
      streakDays: 0,
      monthlyActivity: fallbackMonths,
      githubData: null,
    };
  }
}

export async function updateUserProfile(data: {
  fullName?: string;
  githubUsername?: string;
  skills?: string[];
  bio?: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to update your profile.');

  const updatePayload: {
    full_name?: string;
    github_username?: string | null;
    skills?: string[];
    bio?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof data.fullName === 'string' && data.fullName.trim()) {
    updatePayload.full_name = data.fullName.trim();
  }

  if (typeof data.githubUsername === 'string') {
    updatePayload.github_username = data.githubUsername.trim().replace(/^@/, '') || null;
  }

  if (Array.isArray(data.skills)) {
    updatePayload.skills = data.skills.map((s) => s.trim()).filter(Boolean);
  }

  if (typeof data.bio === 'string') {
    updatePayload.bio = data.bio.trim() || null;
  }

  // Also sync to auth user metadata so it persists even if DB schema cache is refreshing
  try {
    await supabase.auth.updateUser({
      data: {
        ...(updatePayload.github_username !== undefined ? { github_username: updatePayload.github_username } : {}),
        ...(updatePayload.full_name ? { full_name: updatePayload.full_name } : {}),
        ...(updatePayload.bio !== undefined ? { bio: updatePayload.bio } : {}),
        ...(updatePayload.skills ? { skills: updatePayload.skills } : {}),
      },
    });
  } catch {
    // Continue if metadata sync is not supported by current session
  }

  // Notice: Role is STRICTLY OMITTED so user cannot update role!
  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', currentUser.id);

  if (error) {
    // If the database column is missing from an unapplied migration, fallback to updating core fields
    if (error.message.includes('column') || error.message.includes('schema cache')) {
      const fallbackPayload: { full_name?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      if (updatePayload.full_name) fallbackPayload.full_name = updatePayload.full_name;

      const { error: fallbackError } = await supabase
        .from('profiles')
        .update(fallbackPayload)
        .eq('id', currentUser.id);

      if (fallbackError) {
        throw new Error(`Failed to update profile: ${fallbackError.message}`);
      }
      return;
    }
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Dynamic profile completeness calculator:
 * Name (+20), Course/Year (+15), Skills (+20), Bio (+20), GitHub (+15), Social links (+10) = 100%
 */
export function calculateProfileCompleteness(profile: {
  name?: string | null;
  year?: string | null;
  courseYear?: string | null;
  skills?: string[] | null;
  bio?: string | null;
  githubUsername?: string | null;
  links?: { linkedin?: string; github?: string; x?: string; portfolio?: string } | null;
}): number {
  let score = 0;
  if (profile.name?.trim()) score += 20;
  if (profile.year?.trim() || profile.courseYear?.trim()) score += 15;
  if (Array.isArray(profile.skills) && profile.skills.length > 0) score += 20;
  if (profile.bio?.trim()) score += 20;
  if (profile.githubUsername?.trim() || (profile.links?.github && !profile.links.github.includes('['))) score += 15;
  const hasSocial = Boolean(
    (profile.links?.linkedin && !profile.links.linkedin.includes('[')) ||
    (profile.links?.x && !profile.links.x.includes('[')) ||
    (profile.links?.portfolio && !profile.links.portfolio.includes('['))
  );
  if (hasSocial) score += 10;
  return Math.min(100, score);
}

/**
 * Fetch all visible students from Supabase (respecting privacy flags).
 */
export async function getPublicStudents(): Promise<Student[]> {
  if (!isSupabaseConfigured()) {
    return students;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, course_year, bio, skills, github_username, is_profile_private')
      .neq('is_profile_private', true);

    if (error || !data || data.length === 0) {
      return students;
    }

    return data.map((p) => {
      const handle = p.email ? p.email.split('@')[0] : p.id.slice(0, 8);
      const studentSkills = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills : ['React', 'TypeScript', 'Git'];
      const studentLinks = {
        linkedin: '',
        github: p.github_username ? `github.com/${p.github_username}` : '',
        x: '',
        portfolio: '',
      };
      return {
        id: p.id,
        name: p.full_name || 'Campus Student',
        handle,
        branch: p.course_year ? p.course_year.split(' ')[0] : 'CSE',
        year: p.course_year || '3rd year',
        bio: p.bio || 'Student at UGSOT ADYPU learning, building, and contributing in the open.',
        skills: studentSkills,
        lookingForTeam: true,
        links: studentLinks,
        achievements: [],
        going: [],
        profileCompleteness: calculateProfileCompleteness({
          name: p.full_name,
          courseYear: p.course_year,
          bio: p.bio,
          skills: studentSkills,
          githubUsername: p.github_username,
          links: studentLinks,
        }),
      };
    });
  } catch {
    return students;
  }
}

/**
 * Fetch a single public student profile by ID or handle.
 */
export async function getPublicStudentById(id: string): Promise<Student | null> {
  if (!isSupabaseConfigured()) {
    return getStudent(id) || null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: p } = await supabase
      .from('profiles')
      .select('id, full_name, email, course_year, bio, skills, github_username, is_profile_private')
      .eq('id', id)
      .maybeSingle();

    if (p) {
      if (p.is_profile_private) return null;
      const handle = p.email ? p.email.split('@')[0] : p.id.slice(0, 8);
      const studentSkills = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills : ['React', 'TypeScript', 'Git'];
      const studentLinks = {
        linkedin: '',
        github: p.github_username ? `github.com/${p.github_username}` : '',
        x: '',
        portfolio: '',
      };
      return {
        id: p.id,
        name: p.full_name || 'Campus Student',
        handle,
        branch: p.course_year ? p.course_year.split(' ')[0] : 'CSE',
        year: p.course_year || '3rd year',
        bio: p.bio || 'Student at UGSOT ADYPU learning, building, and contributing in the open.',
        skills: studentSkills,
        lookingForTeam: true,
        links: studentLinks,
        achievements: [],
        going: [],
        profileCompleteness: calculateProfileCompleteness({
          name: p.full_name,
          courseYear: p.course_year,
          bio: p.bio,
          skills: studentSkills,
          githubUsername: p.github_username,
          links: studentLinks,
        }),
      };
    }

    return getStudent(id) || null;
  } catch {
    return getStudent(id) || null;
  }
}

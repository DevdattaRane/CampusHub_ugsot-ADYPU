import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import type {
  LeaderboardEntry,
  LeaderboardTimeFilter,
  LeaderboardCategoryFilter,
  UserLeaderboardPosition,
} from '@/lib/types';
import type { Database } from './database.types';

export interface PointRuleItem {
  actionKey: string;
  points: number;
  category: 'events' | 'projects' | 'forum' | 'mentorship';
  description: string;
}

export const DEFAULT_POINT_RULES: PointRuleItem[] = [
  { actionKey: 'event_registered', points: 2, category: 'events', description: 'Registered for a campus event' },
  { actionKey: 'event_attended', points: 10, category: 'events', description: 'Attended an event (marked present)' },
  { actionKey: 'certificate_earned', points: 5, category: 'events', description: 'Official event completion certificate earned' },
  { actionKey: 'hackathon_team', points: 8, category: 'events', description: 'Created or joined a hackathon team' },
  { actionKey: 'project_posted', points: 15, category: 'projects', description: 'Published a student project in the showcase' },
  { actionKey: 'project_like_received', points: 1, category: 'projects', description: 'Like received on your project (max 20 per project, no self-likes)' },
  { actionKey: 'project_comment_received', points: 1, category: 'projects', description: 'Comment received on your project (max 20 per project, no self-comments)' },
  { actionKey: 'forum_question_posted', points: 2, category: 'forum', description: 'Posted a technical question in the community forum' },
  { actionKey: 'forum_answer_posted', points: 5, category: 'forum', description: 'Posted an answer or response to a question' },
  { actionKey: 'forum_answer_accepted', points: 15, category: 'forum', description: 'Answer verified and accepted by question author (no self-accepts)' },
  { actionKey: 'forum_upvote_received', points: 1, category: 'forum', description: 'Upvote received on a forum post or answer (max 20 per item, no self-upvotes)' },
  { actionKey: 'mentorship_mentor_completed', points: 10, category: 'mentorship', description: 'Completed a 1:1 mentorship session as a mentor' },
  { actionKey: 'mentorship_mentee_completed', points: 3, category: 'mentorship', description: 'Completed a 1:1 mentorship session as a mentee' },
  { actionKey: 'code_review_completed', points: 8, category: 'mentorship', description: 'Provided constructive review on submitted code' },
];

/**
 * Fetch leaderboard entries with rank, points breakdown, and earned badges.
 */
export async function getLeaderboardEntries(options?: {
  timeFilter?: LeaderboardTimeFilter;
  categoryFilter?: LeaderboardCategoryFilter;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const timeFilter = options?.timeFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'overall';
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const search = options?.search ? options.search.trim().toLowerCase() : '';

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_time_filter: timeFilter,
      p_category_filter: categoryFilter,
      p_limit: limit,
      p_offset: offset,
    });

    if (error || !data) {
      return [];
    }

    const mapped: LeaderboardEntry[] = (data as Database['public']['Functions']['get_leaderboard']['Returns']).map(
      (row) => ({
        userId: row.user_id,
        name: row.full_name || 'Anonymous Student',
        email: row.email,
        courseYear: row.course_year,
        githubUsername: row.github_username,
        eventsPoints: Number(row.events_points || 0),
        projectsPoints: Number(row.projects_points || 0),
        forumPoints: Number(row.forum_points || 0),
        mentorshipPoints: Number(row.mentorship_points || 0),
        totalPoints: Number(row.total_points || 0),
        score: Number(row.score || 0),
        rank: Number(row.rank || 0),
        badges: Array.isArray(row.badges) ? row.badges : [],
        firstActivityAt: row.first_activity_at || new Date().toISOString(),
      })
    );

    if (search) {
      return mapped.filter(
        (entry) =>
          entry.name.toLowerCase().includes(search) ||
          entry.email.toLowerCase().includes(search) ||
          (entry.courseYear && entry.courseYear.toLowerCase().includes(search))
      );
    }

    return mapped;
  } catch {
    return [];
  }
}

/**
 * Fetch a specific signed-in user's rank, score, and points needed to reach next rank.
 */
export async function getUserLeaderboardPosition(
  userId: string,
  timeFilter: LeaderboardTimeFilter = 'all',
  categoryFilter: LeaderboardCategoryFilter = 'overall'
): Promise<UserLeaderboardPosition | null> {
  if (!isSupabaseConfigured() || !userId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_user_leaderboard_position', {
      p_user_id: userId,
      p_time_filter: timeFilter,
      p_category_filter: categoryFilter,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      userId: row.user_id,
      rank: Number(row.rank || 0),
      score: Number(row.score || 0),
      totalPoints: Number(row.total_points || 0),
      pointsToNextRank: Number(row.points_to_next_rank || 0),
      nextRankScore: Number(row.next_rank_score || 0),
      badges: Array.isArray(row.badges) ? row.badges : [],
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve point rules from the database or default rules fallback.
 */
export async function getPointRules(): Promise<PointRuleItem[]> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_POINT_RULES;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('point_rules')
      .select('action_key, points, category, description')
      .order('points', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_POINT_RULES;
    }

    return data.map((r) => ({
      actionKey: r.action_key,
      points: r.points,
      category: r.category as 'events' | 'projects' | 'forum' | 'mentorship',
      description: r.description,
    }));
  } catch {
    return DEFAULT_POINT_RULES;
  }
}

/**
 * Organizers/admins can toggle leaderboard visibility for a user (Step 6 moderation).
 */
export async function toggleUserLeaderboardVisibility(
  targetUserId: string,
  isHidden: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') {
    return { success: false, error: 'Unauthorized: Only organizers can moderate leaderboard visibility.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_hidden_from_leaderboard: isHidden })
      .eq('id', targetUserId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update visibility';
    return { success: false, error: message };
  }
}

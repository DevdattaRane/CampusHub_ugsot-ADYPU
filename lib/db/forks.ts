import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export interface StudentForkSummary {
  id: string;
  name: string;
  email: string;
  courseYear: string;
  bio: string;
  skills: string[];
  dockersCount: number;
  dockingCount: number;
  isProfilePrivate: boolean;
  createdAt: string;
}

export interface ForkStatusResult {
  isForking: boolean;
  dockersCount: number;
  dockingCount: number;
}

// In-memory fallback state for graceful degradation
const memoryForks = new Set<string>(); // key: `${forkerId}:${forkedId}`
const memoryForkCooldowns = new Map<string, number>();

/**
 * Checks if the current authenticated user is forking a target user
 */
export async function isForkingUser(targetUserId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  if (!isSupabaseConfigured()) {
    return memoryForks.has(`${currentUser.id}:${targetUserId}`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('user_forks')
      .select('id')
      .eq('forker_id', currentUser.id)
      .eq('forked_id', targetUserId)
      .maybeSingle();

    if (error) {
      return memoryForks.has(`${currentUser.id}:${targetUserId}`);
    }
    return Boolean(data);
  } catch {
    return memoryForks.has(`${currentUser.id}:${targetUserId}`);
  }
}

/**
 * Gets live dockers and docking counts for a student
 */
export async function getForkCounts(userId: string): Promise<{ dockersCount: number; dockingCount: number }> {
  if (!isSupabaseConfigured()) {
    let dockers = 0;
    let docking = 0;
    for (const key of memoryForks) {
      const [f, t] = key.split(':');
      if (t === userId) dockers++;
      if (f === userId) docking++;
    }
    return { dockersCount: dockers, dockingCount: docking };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('profiles')
      .select('dockers_count, docking_count')
      .eq('id', userId)
      .maybeSingle();

    if (data && typeof data.dockers_count === 'number') {
      return {
        dockersCount: data.dockers_count || 0,
        dockingCount: data.docking_count || 0,
      };
    }

    // Fallback: direct table count
    const [dockersRes, dockingRes] = await Promise.all([
      supabase.from('user_forks').select('*', { count: 'exact', head: true }).eq('forked_id', userId),
      supabase.from('user_forks').select('*', { count: 'exact', head: true }).eq('forker_id', userId),
    ]);

    return {
      dockersCount: dockersRes.count || 0,
      dockingCount: dockingRes.count || 0,
    };
  } catch {
    return { dockersCount: 0, dockingCount: 0 };
  }
}

/**
 * Fork a student (Follow)
 */
export async function forkStudent(targetUserId: string): Promise<ForkStatusResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('AUTH_REQUIRED: You must be signed in to Fork a student.');
  if (currentUser.id === targetUserId) throw new Error('SELF_FORK_BLOCKED: You cannot Fork yourself.');

  if (!isSupabaseConfigured()) {
    // Memory fallback with local rate limit check
    const now = Date.now();
    const cooldownKey = `${currentUser.id}:${targetUserId}`;
    const lastToggle = memoryForkCooldowns.get(cooldownKey) || 0;
    if (now - lastToggle < 5000) {
      throw new Error('RATE_LIMIT_COOLDOWN: Please wait a few seconds before toggling this action again.');
    }
    memoryForkCooldowns.set(cooldownKey, now);
    memoryForks.add(`${currentUser.id}:${targetUserId}`);
    const counts = await getForkCounts(targetUserId);
    return { isForking: true, dockersCount: counts.dockersCount, dockingCount: counts.dockingCount };
  }

  const supabase = await createSupabaseServerClient();

  // Try RPC first for strict DB rate limits and notification throttling
  const { data, error } = await supabase.rpc('fork_user', { target_user_id: targetUserId });

  if (!error && data) {
    return {
      isForking: true,
      dockersCount: data.dockers_count ?? 1,
      dockingCount: data.docking_count ?? 1,
    };
  }

  // If RPC failed due to rate limit error, propagate clean message
  if (error && error.message.includes('RATE_LIMIT')) {
    const cleanMsg = error.message.replace(/^.*?RATE_LIMIT[A-Z_]*:\s*/i, '');
    throw new Error(cleanMsg || 'Slow down, try again in a minute.');
  }

  // Graceful fallback: direct table insert
  const { error: insertError } = await supabase
    .from('user_forks')
    .insert({ forker_id: currentUser.id, forked_id: targetUserId });

  if (insertError && !insertError.message.includes('duplicate')) {
    throw new Error(insertError.message);
  }

  const counts = await getForkCounts(targetUserId);
  return { isForking: true, dockersCount: counts.dockersCount, dockingCount: counts.dockingCount };
}

/**
 * Unfork a student (Unfollow)
 */
export async function unforkStudent(targetUserId: string): Promise<ForkStatusResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('AUTH_REQUIRED: You must be signed in to Unfork a student.');
  if (currentUser.id === targetUserId) throw new Error('SELF_UNFORK_BLOCKED: You cannot Unfork yourself.');

  if (!isSupabaseConfigured()) {
    memoryForks.delete(`${currentUser.id}:${targetUserId}`);
    const counts = await getForkCounts(targetUserId);
    return { isForking: false, dockersCount: counts.dockersCount, dockingCount: counts.dockingCount };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('unfork_user', { target_user_id: targetUserId });

  if (!error && data) {
    return {
      isForking: false,
      dockersCount: data.dockers_count ?? 0,
      dockingCount: data.docking_count ?? 0,
    };
  }

  if (error && error.message.includes('RATE_LIMIT')) {
    const cleanMsg = error.message.replace(/^.*?RATE_LIMIT[A-Z_]*:\s*/i, '');
    throw new Error(cleanMsg || 'Slow down, try again in a moment.');
  }

  // Fallback: direct delete
  await supabase
    .from('user_forks')
    .delete()
    .eq('forker_id', currentUser.id)
    .eq('forked_id', targetUserId);

  const counts = await getForkCounts(targetUserId);
  return { isForking: false, dockersCount: counts.dockersCount, dockingCount: counts.dockingCount };
}

/**
 * Paginated list of Dockers (students who forked userId)
 * Excludes deleted/suspended profiles and respects privacy flags
 */
export async function getDockers(
  userId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ dockers: StudentForkSummary[]; total: number }> {
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = Math.max(options.offset ?? 0, 0);

  if (!isSupabaseConfigured()) {
    return { dockers: [], total: 0 };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Fetch fork records
    const { data: forkRows, count } = await supabase
      .from('user_forks')
      .select('forker_id, created_at', { count: 'exact' })
      .eq('forked_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!forkRows || forkRows.length === 0) {
      return { dockers: [], total: 0 };
    }

    const forkerIds = forkRows.map((r) => r.forker_id);

    // 2. Fetch profiles batch (avoids N+1)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, course_year, bio, skills, dockers_count, docking_count, is_profile_private, created_at')
      .in('id', forkerIds)
      .eq('is_suspended', false);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const dockers: StudentForkSummary[] = forkRows
      .map((r) => {
        const p = profileMap.get(r.forker_id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.full_name || p.email?.split('@')[0] || 'Student',
          email: '', // Never expose email
          courseYear: p.course_year || 'Student',
          bio: p.bio || '',
          skills: Array.isArray(p.skills) ? p.skills : [],
          dockersCount: p.dockers_count || 0,
          dockingCount: p.docking_count || 0,
          isProfilePrivate: Boolean(p.is_profile_private),
          createdAt: r.created_at,
        };
      })
      .filter((d): d is StudentForkSummary => d !== null);

    return { dockers, total: count || dockers.length };
  } catch (err) {
    console.error('Error fetching dockers:', err);
    return { dockers: [], total: 0 };
  }
}

/**
 * Paginated list of Docking (students whom userId is forking)
 */
export async function getDocking(
  userId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ docking: StudentForkSummary[]; total: number }> {
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = Math.max(options.offset ?? 0, 0);

  if (!isSupabaseConfigured()) {
    return { docking: [], total: 0 };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: forkRows, count } = await supabase
      .from('user_forks')
      .select('forked_id, created_at', { count: 'exact' })
      .eq('forker_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!forkRows || forkRows.length === 0) {
      return { docking: [], total: 0 };
    }

    const forkedIds = forkRows.map((r) => r.forked_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, course_year, bio, skills, dockers_count, docking_count, is_profile_private, created_at')
      .in('id', forkedIds)
      .eq('is_suspended', false);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const docking: StudentForkSummary[] = forkRows
      .map((r) => {
        const p = profileMap.get(r.forked_id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.full_name || p.email?.split('@')[0] || 'Student',
          email: '', // Never expose email
          courseYear: p.course_year || 'Student',
          bio: p.bio || '',
          skills: Array.isArray(p.skills) ? p.skills : [],
          dockersCount: p.dockers_count || 0,
          dockingCount: p.docking_count || 0,
          isProfilePrivate: Boolean(p.is_profile_private),
          createdAt: r.created_at,
        };
      })
      .filter((d): d is StudentForkSummary => d !== null);

    return { docking, total: count || docking.length };
  } catch (err) {
    console.error('Error fetching docking:', err);
    return { docking: [], total: 0 };
  }
}

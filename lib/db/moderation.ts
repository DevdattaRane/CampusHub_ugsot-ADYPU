import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from './notifications';
import type { ReportItem, ReportItemType, ReportStatus, ModerationLog } from '@/lib/types';

/**
 * Fetch all reports (Organizers only).
 */
export async function getReports(statusFilter?: ReportStatus): Promise<ReportItem[]> {
  if (!isSupabaseConfigured()) return [];
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') return [];

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from('reports')
      .select('id, reporter_id, item_type, item_id, reason, details, status, moderator_id, resolution_notes, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      itemType: r.item_type,
      itemId: r.item_id,
      reason: r.reason,
      details: r.details,
      status: r.status as ReportStatus,
      moderatorId: r.moderator_id,
      resolutionNotes: r.resolution_notes,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Submit a report on any content or user.
 */
export async function submitReport(
  itemType: ReportItemType,
  itemId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured.' };
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'You must be signed in to submit a report.' };

  const cleanReason = reason.trim().slice(0, 200);
  const cleanDetails = details ? details.trim().slice(0, 1000) : null;
  if (!cleanReason) return { success: false, error: 'Please select a reason for reporting.' };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      item_type: itemType,
      item_id: itemId,
      reason: cleanReason,
      details: cleanDetails,
      status: 'pending',
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit report';
    return { success: false, error: message };
  }
}

/**
 * Resolve a report (Organizers only).
 */
export async function resolveReport(
  reportId: string,
  action: 'dismiss' | 'action_taken',
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured.' };
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') {
    return { success: false, error: 'Unauthorized: Organizers only.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const newStatus: ReportStatus = action === 'dismiss' ? 'dismissed' : 'action_taken';

    // Get report details to notify reporter
    const { data: report } = await supabase
      .from('reports')
      .select('reporter_id, item_type')
      .eq('id', reportId)
      .maybeSingle();

    const { error } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        moderator_id: currentUser.id,
        resolution_notes: resolutionNotes ? resolutionNotes.trim().slice(0, 500) : null,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) return { success: false, error: error.message };

    // Log action
    await logModerationAction(currentUser.id, `resolve_report_${action}`, 'report', reportId, resolutionNotes);

    // Notify reporter of outcome
    if (report?.reporter_id) {
      await createNotification(
        report.reporter_id,
        'report_outcome',
        'Report Reviewed',
        `Your report on a ${report.item_type.replace('_', ' ')} has been reviewed by the moderation team. Status: ${newStatus.replace('_', ' ')}.`,
        null
      );
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve report';
    return { success: false, error: message };
  }
}

/**
 * Soft-delete (hide) or restore content (Organizers only).
 */
export async function toggleContentHidden(
  contentType: 'forum_post' | 'forum_answer' | 'project' | 'project_comment',
  contentId: string,
  isHidden: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured.' };
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') {
    return { success: false, error: 'Unauthorized: Organizers only.' };
  }

  const tableMap = {
    forum_post: 'forum_posts',
    forum_answer: 'forum_answers',
    project: 'projects',
    project_comment: 'project_comments',
  } as const;

  const tableName = tableMap[contentType];

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from(tableName)
      .update({ is_hidden: isHidden })
      .eq('id', contentId);

    if (error) return { success: false, error: error.message };

    await logModerationAction(
      currentUser.id,
      isHidden ? 'hide_content' : 'restore_content',
      contentType,
      contentId,
      `Soft-delete toggle: is_hidden = ${isHidden}`
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle visibility';
    return { success: false, error: message };
  }
}

/**
 * Warn a user and increment warning count (Organizers only).
 */
export async function warnUser(
  targetUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured.' };
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') {
    return { success: false, error: 'Unauthorized: Organizers only.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('warning_count')
      .eq('id', targetUserId)
      .maybeSingle();

    const newWarnings = (profile?.warning_count || 0) + 1;
    const { error } = await supabase
      .from('profiles')
      .update({ warning_count: newWarnings })
      .eq('id', targetUserId);

    if (error) return { success: false, error: error.message };

    // Send in-app warning notification
    await createNotification(
      targetUserId,
      'system',
      'Community Warning',
      `You have received a formal warning from campus moderators: "${reason.slice(0, 300)}". Continued policy violations may result in account suspension.`,
      '/community'
    );

    await logModerationAction(currentUser.id, 'warn_user', 'user', targetUserId, reason);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to issue warning';
    return { success: false, error: message };
  }
}

/**
 * Suspend or unsuspend a user (Organizers only).
 */
export async function toggleUserSuspension(
  targetUserId: string,
  isSuspended: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not configured.' };
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') {
    return { success: false, error: 'Unauthorized: Organizers only.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: isSuspended,
        suspension_reason: isSuspended ? (reason?.trim().slice(0, 300) || 'Policy violation') : null,
      })
      .eq('id', targetUserId);

    if (error) return { success: false, error: error.message };

    // Notify user
    await createNotification(
      targetUserId,
      'system',
      isSuspended ? 'Account Suspended' : 'Account Reinstated',
      isSuspended
        ? `Your CampusHub posting privileges have been suspended. Reason: ${reason || 'Terms violation'}. Contact organizers for appeal.`
        : 'Your CampusHub posting privileges have been restored. Welcome back.',
      null
    );

    await logModerationAction(
      currentUser.id,
      isSuspended ? 'suspend_user' : 'unsuspend_user',
      'user',
      targetUserId,
      reason
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle suspension';
    return { success: false, error: message };
  }
}

/**
 * Fetch moderation audit logs (Organizers only).
 */
export async function getModerationLogs(limit = 50): Promise<ModerationLog[]> {
  if (!isSupabaseConfigured()) return [];
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'organizer') return [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('moderation_logs')
      .select('id, moderator_id, action, target_type, target_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((l) => ({
      id: l.id,
      moderatorId: l.moderator_id,
      action: l.action,
      targetType: l.target_type,
      targetId: l.target_id,
      details: l.details,
      createdAt: l.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Anti-Spam & Posting Eligibility Verification (Rule 5).
 * Enforces cooldowns, link caps for new accounts, and blocks suspended users.
 */
export async function checkUserPostingEligibility(
  userId: string,
  bodyText = ''
): Promise<{ allowed: boolean; reason?: string }> {
  if (!isSupabaseConfigured() || !userId) return { allowed: true };

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Check account suspension & created_at
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended, suspension_reason, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.is_suspended) {
      return {
        allowed: false,
        reason: `Your account is suspended (${profile.suspension_reason || 'Policy violation'}). You cannot create new posts or projects.`,
      };
    }

    // 2. Cooldown check: no multiple posts within 15 seconds
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000).toISOString();
    const { count: recentForumPosts } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .gte('created_at', fifteenSecondsAgo);

    if (recentForumPosts && recentForumPosts > 0) {
      return {
        allowed: false,
        reason: 'Please wait a few seconds before posting again (rate limit cooldown).',
      };
    }

    // 3. New Account (<24 hours old) external link caps
    if (profile?.created_at) {
      const accountAgeHours = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60);
      if (accountAgeHours < 24) {
        // Count http/https URLs in body text
        const urlMatches = bodyText.match(/https?:\/\/[^\s]+/gi) || [];
        if (urlMatches.length > 2) {
          return {
            allowed: false,
            reason: 'To prevent spam, new student accounts (<24h old) are limited to a maximum of 2 links per post.',
          };
        }
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Internal helper to record moderation audit logs.
 */
async function logModerationAction(
  moderatorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string | null
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from('moderation_logs').insert({
      moderator_id: moderatorId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ? details.slice(0, 500) : null,
    });
  } catch {
    // Continue
  }
}

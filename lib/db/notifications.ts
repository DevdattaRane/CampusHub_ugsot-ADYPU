import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import type { AppNotification, NotificationPreferences, NotificationType } from '@/lib/types';

/**
 * Fetch the notifications for the current signed-in user.
 */
export async function getMyNotifications(limit = 40): Promise<AppNotification[]> {
  if (!isSupabaseConfigured()) return [];
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, link, is_read, created_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type as NotificationType,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Get count of unread notifications for current user.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const currentUser = await getCurrentUser();
  if (!currentUser) return 0;

  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    if (error || typeof count !== 'number') return 0;
    return count;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !notificationId) return false;
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', currentUser.id);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Mark all notifications for current user as read.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Create a new notification on the server.
 * Checks recipient's notification preferences and triggers optional Resend email if configured.
 */
export async function createNotification(
  userIdOrOptions:
    | string
    | {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        linkUrl?: string | null;
        link?: string | null;
        actorId?: string;
      },
  typeParam?: NotificationType,
  titleParam?: string,
  messageParam?: string,
  linkParam?: string | null
): Promise<boolean> {
  const isObj = typeof userIdOrOptions === 'object' && userIdOrOptions !== null;
  const userId = isObj ? userIdOrOptions.userId : userIdOrOptions;
  const type = isObj ? userIdOrOptions.type : typeParam!;
  const title = isObj ? userIdOrOptions.title : titleParam!;
  const message = isObj ? userIdOrOptions.message : messageParam!;
  const link = isObj ? (userIdOrOptions.linkUrl ?? userIdOrOptions.link ?? null) : (linkParam ?? null);

  if (!isSupabaseConfigured() || !userId) return false;

  try {
    const supabase = await createSupabaseServerClient();

    // Check user preferences if available
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (prefs) {
      if (type === 'team_invite' && !prefs.notify_team_invites) return false;
      if (type === 'registration_confirmed' && !prefs.notify_event_updates) return false;
      if ((type === 'mentor_session' || type === 'code_review') && !prefs.notify_mentorship) return false;
      if ((type === 'answer_received' || type === 'answer_accepted') && !prefs.notify_forum) return false;
      if ((type === 'project_interaction' || type === 'collaboration_request' || type === 'project_comment' || type === 'project_like') && !prefs.notify_projects) return false;
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title: title.slice(0, 150),
      message: message.slice(0, 500),
      link: link || null,
      is_read: false,
    });

    if (error) {
      console.warn(`Failed to insert notification: ${error.message}`);
      return false;
    }

    // Optional email notification if RESEND_API_KEY is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && prefs?.email_notifications) {
      sendOptionalEmailNotification(userId, title, message, link).catch(() => {});
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch or initialize notification preferences for current user.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const defaultPrefs: NotificationPreferences = {
    userId: '',
    emailNotifications: false,
    notifyTeamInvites: true,
    notifyEventUpdates: true,
    notifyMentorship: true,
    notifyForum: true,
    notifyProjects: true,
  };

  if (!isSupabaseConfigured()) return defaultPrefs;
  const currentUser = await getCurrentUser();
  if (!currentUser) return defaultPrefs;
  defaultPrefs.userId = currentUser.id;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error || !data) return defaultPrefs;

    return {
      userId: data.user_id,
      emailNotifications: data.email_notifications,
      notifyTeamInvites: data.notify_team_invites,
      notifyEventUpdates: data.notify_event_updates,
      notifyMentorship: data.notify_mentorship,
      notifyForum: data.notify_forum,
      notifyProjects: data.notify_projects,
    };
  } catch {
    return defaultPrefs;
  }
}

/**
 * Update notification preferences for current user.
 */
export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  try {
    const supabase = await createSupabaseServerClient();
    const payload = {
      user_id: currentUser.id,
      ...(prefs.emailNotifications !== undefined ? { email_notifications: prefs.emailNotifications } : {}),
      ...(prefs.notifyTeamInvites !== undefined ? { notify_team_invites: prefs.notifyTeamInvites } : {}),
      ...(prefs.notifyEventUpdates !== undefined ? { notify_event_updates: prefs.notifyEventUpdates } : {}),
      ...(prefs.notifyMentorship !== undefined ? { notify_mentorship: prefs.notifyMentorship } : {}),
      ...(prefs.notifyForum !== undefined ? { notify_forum: prefs.notifyForum } : {}),
      ...(prefs.notifyProjects !== undefined ? { notify_projects: prefs.notifyProjects } : {}),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Helper to deliver email via Resend API (strictly optional, graceful degradation).
 */
async function sendOptionalEmailNotification(
  userId: string,
  title: string,
  message: string,
  link?: string | null
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@campushub.adypu.edu.in';
  if (!apiKey) return;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.email) return;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `CampusHub UGSOT <${fromEmail}>`,
        to: [profile.email],
        subject: `[CampusHub] ${title}`,
        text: `${message}\n\nView on CampusHub: ${link || 'https://campushub.adypu.edu.in'}`,
      }),
    });
  } catch {
    // Graceful degradation: never fail or throw if email service is down or unconfigured
  }
}

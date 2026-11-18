'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AppNotification, NotificationPreferences, NotificationType } from '@/lib/types';

type Props = {
  initialNotifications: AppNotification[];
  initialPreferences: NotificationPreferences;
};

const TYPE_ICONS: Record<NotificationType, string> = {
  team_invite: '🚀',
  registration_confirmed: '🎟️',
  waitlist_promoted: '⏳',
  mentor_session: '🤝',
  code_review: '🔍',
  answer_received: '💬',
  answer_accepted: '✅',
  project_interaction: '💻',
  project_comment: '💬',
  project_like: '❤️',
  collaboration_request: '👥',
  report_outcome: '🛡️',
  announcement: '📢',
  fork: '🍴',
  system: '⚡',
};

export default function NotificationsView({
  initialNotifications,
  initialPreferences,
}: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id }),
      });
    } catch {
      // Revert if error
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch {
      // Continue
    } finally {
      setMarkingAll(false);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const nextVal = !preferences[key];
    const newPrefs = { ...preferences, [key]: nextVal };
    setPreferences(newPrefs);
    setSavingPrefs(true);

    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextVal }),
      });
    } catch {
      // Continue
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="notifications-view">
      <div className="notifications-toolbar">
        <div className="notifications-toolbar__filters" role="group" aria-label="Filter notifications">
          <button
            type="button"
            className="pill r sm"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            className="pill r sm"
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="notifications-toolbar__actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="pill r sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}

          <button
            type="button"
            className="pill r sm"
            aria-pressed={showPrefs}
            onClick={() => setShowPrefs((prev) => !prev)}
          >
            Preferences
          </button>
        </div>
      </div>

      {showPrefs && (
        <section className="notification-preferences" aria-labelledby="notification-preferences-title">
          <div className="notification-preferences__head">
            <h2 id="notification-preferences-title">Notification preferences</h2>
            {savingPrefs && <span className="mono" role="status">Saving...</span>}
          </div>
          <p className="notification-preferences__copy">
            Choose which in-app updates you receive and configure optional email alerts.
          </p>

          <div className="notification-preferences__grid">
            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.notifyTeamInvites}
                onChange={() => handleTogglePref('notifyTeamInvites')}
              />
              Hackathon team invites
            </label>

            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.notifyEventUpdates}
                onChange={() => handleTogglePref('notifyEventUpdates')}
              />
              Event and waitlist updates
            </label>

            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.notifyMentorship}
                onChange={() => handleTogglePref('notifyMentorship')}
              />
              Mentorship and code reviews
            </label>

            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.notifyForum}
                onChange={() => handleTogglePref('notifyForum')}
              />
              Community answers and accepts
            </label>

            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.notifyProjects}
                onChange={() => handleTogglePref('notifyProjects')}
              />
              Project comments and likes
            </label>

            <label className="notification-preferences__option">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={() => handleTogglePref('emailNotifications')}
              />
              Email notifications (important only)
            </label>
          </div>
        </section>
      )}

      {displayedNotifications.length > 0 ? (
        <div className="notification-list" aria-live="polite">
          {displayedNotifications.map((n) => {
            const icon = TYPE_ICONS[n.type] || '🔔';
            const formattedTime = new Date(n.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={n.id}
                className={`notification-item${n.isRead ? '' : ' notification-item--unread'}`}
              >
                <div className="notification-item__body">
                  <span className="notification-item__icon" aria-hidden="true">{icon}</span>
                  <div className="notification-item__copy">
                    <div className="notification-item__heading">
                      <span className="notification-item__title">{n.title}</span>
                      {!n.isRead && (
                        <span className="notification-item__new">New</span>
                      )}
                    </div>
                    <p className="notification-item__message">{n.message}</p>
                    <div className="notification-item__meta">
                      <span className="mono">{formattedTime}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(n.id);
                          }}
                          className="notification-item__link"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="notification-item__mark-read"
                  >
                    ✓
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="notification-empty empty"
          role="status"
        >
          <h2>You are all caught up</h2>
          <p>
            No {filter === 'unread' ? 'unread' : ''} notifications at the moment.
          </p>
        </div>
      )}
    </div>
  );
}

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
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          border: '2px solid #111',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          boxShadow: '3px 3px 0 #111',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1.5px solid #111',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              backgroundColor: filter === 'all' ? '#111' : '#F6F1E7',
              color: filter === 'all' ? '#FFF' : '#111',
            }}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1.5px solid #111',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              backgroundColor: filter === 'unread' ? '#FFE14D' : '#F6F1E7',
              color: '#111',
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                padding: '6px 12px',
                backgroundColor: '#fff',
                border: '1.5px solid #111',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPrefs((prev) => !prev)}
            style={{
              padding: '6px 12px',
              backgroundColor: showPrefs ? '#2B50FF' : '#fff',
              color: showPrefs ? '#fff' : '#111',
              border: '1.5px solid #111',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚙️ Preferences
          </button>
        </div>
      </div>

      {/* Preferences Drawer / Accordion */}
      {showPrefs && (
        <div
          className="card"
          style={{
            padding: 20,
            border: '2px solid #111',
            borderRadius: 4,
            backgroundColor: '#FAF8F5',
            boxShadow: '3px 3px 0 #111',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Notification Preferences</h3>
            {savingPrefs && <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>Saving...</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
            Choose which in-app updates you receive and configure optional email alerts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyTeamInvites}
                onChange={() => handleTogglePref('notifyTeamInvites')}
              />
              🚀 Hackathon Team Invites
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyEventUpdates}
                onChange={() => handleTogglePref('notifyEventUpdates')}
              />
              🎟️ Event & Waitlist Updates
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyMentorship}
                onChange={() => handleTogglePref('notifyMentorship')}
              />
              🤝 Mentorship & Code Reviews
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyForum}
                onChange={() => handleTogglePref('notifyForum')}
              />
              💬 Forum Answers & Accepts
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.notifyProjects}
                onChange={() => handleTogglePref('notifyProjects')}
              />
              💻 Project Comments & Likes
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={() => handleTogglePref('emailNotifications')}
              />
              ✉️ Email Notifications (Important Only)
            </label>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {displayedNotifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                className="card"
                style={{
                  padding: '16px 18px',
                  border: '2px solid #111',
                  borderRadius: 4,
                  backgroundColor: n.isRead ? '#FFFFFF' : '#FEF9C3',
                  boxShadow: '2px 2px 0 #111',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 14,
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>{n.title}</span>
                      {!n.isRead && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            backgroundColor: '#FFE14D',
                            padding: '2px 6px',
                            borderRadius: 3,
                            border: '1px solid #111',
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 6px 0', fontSize: 13, color: '#333', lineHeight: 1.45 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#777' }}>{formattedTime}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(n.id);
                          }}
                          style={{ fontSize: 12, fontWeight: 700, color: '#2B50FF', textDecoration: 'underline' }}
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
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 16,
                      cursor: 'pointer',
                      padding: 4,
                      color: '#666',
                    }}
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
          className="card"
          style={{
            padding: 48,
            textAlign: 'center',
            border: '2px solid #111',
            borderRadius: 4,
            backgroundColor: '#FFFFFF',
            boxShadow: '3px 3px 0 #111',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>You are all caught up!</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#666' }}>
            No {filter === 'unread' ? 'unread' : ''} notifications at the moment.
          </p>
        </div>
      )}
    </div>
  );
}

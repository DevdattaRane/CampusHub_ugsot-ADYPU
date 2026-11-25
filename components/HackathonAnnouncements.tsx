'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { EventAnnouncement } from '@/lib/db/events';

type Props = {
  eventId: string;
  announcements: EventAnnouncement[];
  isOrganizer: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export default function HackathonAnnouncements({
  eventId,
  announcements,
  isOrganizer,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = new FormData(form).get('message');
    if (typeof content !== 'string' || !content.trim()) {
      setError('Write an announcement before posting.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const formMessage = typeof payload === 'object' && payload !== null
          && 'form' in payload && typeof payload.form === 'string'
          ? payload.form
          : 'We couldn’t post the announcement. Please try again.';
        setError(formMessage);
        return;
      }

      form.reset();
      setMessage('Announcement posted.');
      router.refresh();
    } catch (requestError) {
      console.error('Announcement request failed.', requestError);
      setError('We couldn’t reach CampusHub. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card hackathon-panel" aria-labelledby="announcements-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Updates from organizers</p>
          <h2 id="announcements-title" className="card__title">Announcements</h2>
        </div>
      </div>
      {isOrganizer && (
        <form className="hackathon-form" onSubmit={submitAnnouncement}>
          <label className="field" htmlFor="announcement-message">
            <span className="field__label">Post an update</span>
            <textarea id="announcement-message" name="message" className="textarea" rows={3}
              maxLength={1000} required placeholder="Share an update with participants." />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button type="submit" className="btn btn--dark" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post announcement'}
          </button>
        </form>
      )}
      {announcements.length ? (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="announcement-card">
              <div className="announcement-card__head">
                <strong>{announcement.authorName}</strong>
                <time dateTime={announcement.createdAt}>
                  {dateFormatter.format(new Date(announcement.createdAt))}
                </time>
              </div>
              <p>{announcement.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">No announcements yet. Check back for organizer updates.</p>
      )}
    </section>
  );
}

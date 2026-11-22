'use client';

import { useState } from 'react';
import { formatEventDateRange } from '@/lib/dates';
import {
  EVENT_LOCATIONS,
  EVENT_MODES,
  PUBLISHABLE_EVENT_CATEGORIES,
  type PublishableEventCategory,
  type EventMode,
  type EventWhere,
  type NoticeboardCampusEvent,
} from '@/lib/types';
import styles from './organizer.module.css';

type Props = {
  initialEvents: NoticeboardCampusEvent[];
  loadError: string;
};

type FormState = {
  title: string;
  category: PublishableEventCategory;
  description: string;
  mode: EventMode;
  where: EventWhere;
  place: string;
  start: string;
  end: string;
  registrationDeadline: string;
  capacity: string;
  isPublished: boolean;
};

function emptyForm(): FormState {
  return {
    title: '',
    category: 'Workshop',
    description: '',
    mode: 'Offline',
    where: 'In campus',
    place: '',
    start: '',
    end: '',
    registrationDeadline: '',
    capacity: '50',
    isPublished: false,
  };
}

function formFromEvent(event: NoticeboardCampusEvent): FormState {
  return {
    title: event.title,
    category: event.category,
    description: event.description,
    mode: event.mode,
    where: event.where,
    place: event.place,
    start: event.start,
    end: event.end ?? '',
    registrationDeadline: event.registrationDeadline,
    capacity: String(event.capacity),
    isPublished: event.isPublished,
  };
}

export default function OrganizerEventManager({ initialEvents, loadError }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEditing(event: NoticeboardCampusEvent) {
    setEditingId(event.id);
    setForm(formFromEvent(event));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm());
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        editingId ? `/api/organizer/events/${editingId}` : '/api/organizer/events',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            capacity: Number(form.capacity),
            end: form.end || undefined,
          }),
        },
      );
      const result: { event?: NoticeboardCampusEvent; error?: string } = await response.json();
      if (!response.ok || !result.event) {
        throw new Error(result.error || 'Unable to save this event listing.');
      }

      const savedEvent = result.event;
      setEvents((current) => {
        const next = editingId
          ? current.map((item) => item.id === savedEvent.id ? savedEvent : item)
          : [...current, savedEvent];
        return next.sort((a, b) => a.start.localeCompare(b.start));
      });
      setEditingId(null);
      setForm(emptyForm());
      setSuccessMessage(
        savedEvent.isPublished
          ? 'Event saved and published to the public listings.'
          : 'Event saved as a draft. Only organizers can see it.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save this event listing.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.manager}>
      <section className={styles.panel} aria-labelledby="event-form-title">
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Organizer publishing</p>
            <h2 id="event-form-title">{editingId ? 'Edit event listing' : 'Create an event listing'}</h2>
          </div>
          <p>Only organizer accounts can publish. Drafts remain private to organizers.</p>
        </div>

        {loadError && <p className={styles.error} role="alert">{loadError}</p>}
        {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
        {successMessage && <p className={styles.success} role="status">{successMessage}</p>}

        <form className={styles.form} onSubmit={saveEvent}>
          <label className={styles.field}>
            <span>Event title</span>
            <input
              maxLength={160}
              required
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
            />
          </label>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) => {
                  const category = PUBLISHABLE_EVENT_CATEGORIES.find(
                    (item) => item === event.target.value,
                  );
                  if (category) updateForm('category', category);
                }}
              >
                {PUBLISHABLE_EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Format</span>
              <select
                value={form.mode}
                onChange={(event) => {
                  const mode = EVENT_MODES.find((item) => item === event.target.value);
                  if (mode) updateForm('mode', mode);
                }}
              >
                {EVENT_MODES.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Campus</span>
              <select
                value={form.where}
                onChange={(event) => {
                  const location = EVENT_LOCATIONS.find((item) => item === event.target.value);
                  if (location) updateForm('where', location);
                }}
              >
                {EVENT_LOCATIONS.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Venue / meeting place</span>
              <input
                maxLength={160}
                required
                value={form.place}
                onChange={(event) => updateForm('place', event.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Event details</span>
            <textarea
              maxLength={1200}
              required
              rows={4}
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
            />
          </label>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Starts</span>
              <input
                type="date"
                required
                value={form.start}
                onChange={(event) => updateForm('start', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Ends (optional)</span>
              <input
                type="date"
                min={form.start || undefined}
                value={form.end}
                onChange={(event) => updateForm('end', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Registration deadline</span>
              <input
                type="date"
                max={form.start || undefined}
                required
                value={form.registrationDeadline}
                onChange={(event) => updateForm('registrationDeadline', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Capacity</span>
              <input
                type="number"
                min={1}
                max={10000}
                required
                value={form.capacity}
                onChange={(event) => updateForm('capacity', event.target.value)}
              />
            </label>
          </div>

          <label className={styles.publishToggle}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateForm('isPublished', event.target.checked)}
            />
            <span>Publish this event to the public Noticeboard and Events page</span>
          </label>

          <div className={styles.actions}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : form.isPublished ? 'Save and publish' : 'Save draft'}
            </button>
            {editingId && (
              <button type="button" className="btn btn--ghost" onClick={cancelEditing} disabled={submitting}>
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="event-list-title">
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Your event catalog</p>
            <h2 id="event-list-title">Listings and drafts</h2>
          </div>
          <p>Unpublish a listing by editing it and clearing the publish checkbox.</p>
        </div>
        {events.length ? (
          <ul className={styles.eventList}>
            {events.map((event) => (
              <li className={styles.eventRow} key={event.id}>
                <div>
                  <div className={styles.eventMeta}>
                    <span data-status={event.isPublished ? 'published' : 'draft'}>
                      {event.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span>{formatEventDateRange(event.start, event.end)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p>{event.category} · {event.place}</p>
                </div>
                <button type="button" className="btn btn--ghost" onClick={() => startEditing(event)}>
                  Edit
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No event listings yet. Create a draft above to get started.</p>
        )}
      </section>
    </div>
  );
}

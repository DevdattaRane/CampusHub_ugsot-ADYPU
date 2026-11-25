'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CampusEvent } from '@/lib/types';
import { typeColors } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import Calendar from './Calendar';
import FilterPills from './FilterPills';
import EventDateBlock from './EventDateBlock';
import Tag from './ui/Tag';
import EventRegistrationControl from './EventRegistrationControl';
import type { EventRegistrationStatus } from '@/lib/db/events';

const MODES = ['All', 'Online', 'Offline'] as const;
const WHERE = ['All', 'In campus', 'Out of campus'] as const;
const VIEWS = ['List', 'Calendar'] as const;

type Props = {
  events: CampusEvent[];
  today: string;
  signedIn: boolean;
  statuses: EventRegistrationStatus[];
  registrationUnavailable: boolean;
  isOrganizer?: boolean;
};

export default function EventsBrowser({
  events,
  today,
  signedIn,
  statuses,
  registrationUnavailable,
  isOrganizer,
}: Props) {
  const [mode, setMode] = useState<(typeof MODES)[number]>('All');
  const [where, setWhere] = useState<(typeof WHERE)[number]>('All');
  const [view, setView] = useState<(typeof VIEWS)[number]>('List');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      events
        .filter((e) => (mode === 'All' || e.mode === mode) && (where === 'All' || e.where === where))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [events, mode, where],
  );
  const upcoming = filtered.filter((e) => (e.end ?? e.start) >= today);
  const statusesByEvent = new Map(statuses.map((status) => [status.eventId, status]));

  return (
    <>
      {registrationUnavailable && (
        <p className="form-error" role="alert">
          Registration details are temporarily unavailable. Please try again later.
        </p>
      )}
      <section aria-label="Filters" className="card filters">
        <FilterPills label="Mode" options={MODES} value={mode} onChange={setMode} />
        <FilterPills label="Where" options={WHERE} value={where} onChange={setWhere} />
        <div className="segmented filters__end" role="group" aria-label="View">
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </section>

      {view === 'List' ? (
        <>
          <p className="count" aria-live="polite">
            <strong>{upcoming.length}</strong> {upcoming.length === 1 ? 'upcoming event' : 'upcoming events'}
          </p>
          {upcoming.length > 0 ? (
            <div className="event-grid">
              {upcoming.map((e) => (
                <article key={e.id} className="event-card">
                  <div className="event-card__top">
                    <EventDateBlock event={e} variant="card" />
                    <div style={{ minWidth: 0 }}>
                      <h2 className="event-card__title">
                        {e.type === 'hackathon'
                          ? <Link href={`/events/${e.id}`} className="event-card__title-link">{e.title}</Link>
                          : e.title}
                      </h2>
                      <p className="event-card__place">{e.place}</p>
                    </div>
                  </div>
                  <div className="chip-row">
                    <Tag className="chip" style={{ background: typeColors[e.category].bg, color: typeColors[e.category].fg }}>{e.category}</Tag>
                    <span className="chip chip--neutral">{e.mode}</span>
                    <span className="chip chip--neutral">{e.where}</span>
                  </div>
                  <div className="event-card__foot">
                    <span className="chip chip--deadline">
                      Closes {formatShort(statusesByEvent.get(e.id)?.registrationDeadline ?? e.registrationDeadline)}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {isOrganizer && (
                        <Link
                          href={`/events/${e.id}/attendance`}
                          className="btn btn--ghost"
                          style={{ fontSize: 13, padding: '6px 12px', minHeight: 36 }}
                        >
                          📋 Attendance
                        </Link>
                      )}
                      <EventRegistrationControl event={e} status={statusesByEvent.get(e.id)}
                        signedIn={signedIn} unavailable={registrationUnavailable} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">No upcoming events match these filters. Try another combo.</p>
          )}
        </>
      ) : (
        <Calendar events={filtered} today={today} wide selected={selectedDate} onSelect={setSelectedDate} />
      )}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { CampusEvent } from '@/lib/types';
import { typeColors } from '@/lib/colors';
import { formatShort } from '@/lib/dates';
import Calendar from './Calendar';
import FilterPills from './FilterPills';
import EventDateBlock from './EventDateBlock';

const MODES = ['All', 'Online', 'Offline'] as const;
const WHERE = ['All', 'In campus', 'Out of campus'] as const;
const VIEWS = ['List', 'Calendar'] as const;

export default function EventsBrowser({ events, today }: { events: CampusEvent[]; today: string }) {
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

  return (
    <>
      <section aria-label="Filters" className="filters">
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
          <p className="count">{upcoming.length === 1 ? '1 upcoming event' : `${upcoming.length} upcoming events`}</p>
          {upcoming.length > 0 ? (
            <div className="event-grid">
              {upcoming.map((e) => (
                <article key={e.id} className="event-card">
                  <div className="event-card__top">
                    <EventDateBlock event={e} variant="card" />
                    <div style={{ minWidth: 0 }}>
                      <h2 className="event-card__title">{e.title}</h2>
                      <p className="event-card__place">{e.place}</p>
                    </div>
                  </div>
                  <div className="chip-row">
                    <span className="chip" style={{ background: typeColors[e.type].bg, color: typeColors[e.type].fg }}>{e.type}</span>
                    <span className="chip chip--neutral">{e.mode}</span>
                    <span className="chip chip--neutral">{e.where}</span>
                  </div>
                  <div className="event-card__foot">
                    <span className="chip chip--deadline">Closes {formatShort(e.deadline)}</span>
                    <a href={e.registerUrl} className="btn btn--dark">Register</a>
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

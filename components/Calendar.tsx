'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { CampusEvent, EventType } from '@/lib/types';
import { typeColors, weekdayStripe } from '@/lib/colors';
import { MONTHS, MONTHS_SHORT, eventDays, formatShort, parseDate, sameDay, toISO } from '@/lib/dates';
import { ChevronLeft, ChevronRight, Sparkle } from './icons';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_CHIPS = 2;

type Props = {
  events: CampusEvent[];
  /** YYYY-MM-DD, used to mark today and pick the starting month */
  today: string;
  /** When set, days are buttons and clicking one reports its date (or null to clear). */
  selected?: string | null;
  onSelect?: (iso: string | null) => void;
  wide?: boolean;
  /** Rendered between the header and the grid (e.g. filters). */
  toolbar?: ReactNode;
  /** Rendered under the grid (e.g. the agenda). */
  footer?: ReactNode;
};

export default function Calendar({ events, today, selected = null, onSelect, wide = false, toolbar, footer }: Props) {
  const todayDate = parseDate(today);
  const [view, setView] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const selectable = typeof onSelect === 'function';

  // Map each calendar day to the events on it.
  const byDay = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    for (const e of events) {
      for (const d of eventDays(e)) {
        const key = toISO(d);
        map.set(key, [...(map.get(key) ?? []), e]);
      }
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const date = new Date(view.year, view.month, i - lead + 1);
      return { date, iso: toISO(date), inMonth: date.getMonth() === view.month };
    });
  }, [view]);

  const shiftMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    onSelect?.(null);
  };

  const legend = Object.keys(typeColors) as EventType[];

  return (
    <section className={`calendar${wide ? ' calendar--wide' : ''}`} aria-labelledby="calendar-title">
      <div className="calendar__head">
        <h2 id="calendar-title" className="calendar__title">
          <Sparkle />
          Calendar
          <span className="sr-only">, {MONTHS[view.month]} {view.year}</span>
        </h2>
        <div className="legend" aria-label="Event types">
          {legend.map((t) => (
            <span key={t} className="sticker" style={{ background: typeColors[t].bg }}>{t}</span>
          ))}
        </div>
      </div>

      {toolbar}

      <div className="calendar__body">
        <button type="button" className="calendar__arrow" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <ChevronLeft />
        </button>
        <div aria-hidden="true" className="calendar__month">{MONTHS[view.month]}</div>
        <div className="calendar__scroll">
          <div className="calendar__grid">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className="calendar__weekday">
                {w}
                <span style={{ background: weekdayStripe[i] }} />
              </div>
            ))}

            {cells.map(({ date, iso, inMonth }) => {
              const num = String(date.getDate()).padStart(2, '0');
              const cls = 'day';
              if (!inMonth) {
                return (
                  <div key={iso} aria-hidden="true" className={`${cls} day--outside`}>
                    <span className="day__num">{num}</span>
                  </div>
                );
              }
              const dayEvents = byDay.get(iso) ?? [];
              const isToday = sameDay(date, todayDate);
              const singleEvent = dayEvents.length === 1 ? dayEvents[0] : undefined;
              const eventDescription = dayEvents.map((e) => `${e.title} (${e.type})`).join(', ');
              const content = (
                <>
                  <span className="day__num">{num}</span>
                  {singleEvent ? (
                    <span className="day__single-event">
                      <span className="day__single-title">{singleEvent.title}</span>
                      <span className="day__event-type">{singleEvent.type}</span>
                    </span>
                  ) : (
                    <>
                      {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                        <span key={e.id} className="sticker" style={{ background: typeColors[e.type].bg }} title={e.title}>
                          <span className="day__event-title">{e.title}</span>
                          <span className="day__event-type">{e.type}</span>
                        </span>
                      ))}
                      {dayEvents.length > MAX_CHIPS && <span className="day__more">+{dayEvents.length - MAX_CHIPS} more</span>}
                    </>
                  )}
                  {dayEvents.length > 0 && (
                    <span className="day__markers" aria-hidden="true">
                      {dayEvents.map((e) => (
                        <span key={e.id} className="day__marker" style={{ background: typeColors[e.type].bg }} />
                      ))}
                    </span>
                  )}
                </>
              );
              const label = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}${isToday ? ', today' : ''}${dayEvents.length ? `: ${eventDescription}` : ', no events'}`;
              const className = `${cls}${isToday ? ' day--today' : ''}${singleEvent ? ' day--single' : ''}`;
              const style = singleEvent ? { background: typeColors[singleEvent.type].bg } : undefined;

              return selectable ? (
                <button key={iso} type="button" className={className} style={style} title={eventDescription || undefined} aria-label={label} aria-pressed={selected === iso} onClick={() => onSelect?.(selected === iso ? null : iso)}>
                  {content}
                </button>
              ) : (
                <div key={iso} className={className} style={style} title={eventDescription || undefined} aria-label={label}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
        <button type="button" className="calendar__arrow" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRight />
        </button>
      </div>

      {selected && (
        <section className="calendar__selected-events" aria-live="polite" aria-label={`Events on ${formatShort(selected)}`}>
          <h3 className="agenda__title">Events on {formatShort(selected)}</h3>
          {(byDay.get(selected) ?? []).length ? (byDay.get(selected) ?? []).map((event) => (
            <article key={event.id} className="calendar__selected-event" style={{ background: typeColors[event.type].bg }}>
              <strong title={event.title}>{event.title}</strong>
              <span className="calendar__selected-type">{event.type}</span>
            </article>
          )) : <p className="agenda__empty">No events on this day.</p>}
        </section>
      )}

      {footer}
    </section>
  );
}

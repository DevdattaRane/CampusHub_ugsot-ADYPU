import type { CampusEvent } from '@/lib/types';
import { typeColors } from '@/lib/colors';
import { MONTHS_SHORT, dayRange, parseDate } from '@/lib/dates';

export default function EventDateBlock({ event, variant = 'agenda' }: { event: CampusEvent; variant?: 'agenda' | 'card' }) {
  const c = typeColors[event.type];
  const mon = MONTHS_SHORT[parseDate(event.start).getMonth()];
  return (
    <div
      className={`date-block${variant === 'card' ? ' date-block--outlined' : ''}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <div className="date-block__mon">{mon}</div>
      <div className="date-block__day">{dayRange(event)}</div>
    </div>
  );
}

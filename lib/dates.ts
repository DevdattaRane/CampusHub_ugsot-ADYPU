import type { CampusEvent } from './types';

/** The campus timezone decides what "today" means. */
export const CAMPUS_TZ = 'Asia/Kolkata';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Today's date on campus, as YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAMPUS_TZ }).format(new Date());
}

/** Parses YYYY-MM-DD as a local calendar date (no timezone shifting). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function eventDays(e: CampusEvent): Date[] {
  const start = parseDate(e.start);
  const end = e.end ? parseDate(e.end) : start;
  const days: Date[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
}

/** "Nov 14" */
export function formatShort(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatEventDateRange(start: string, end?: string): string {
  const startLabel = `${formatShort(start)} ${start.slice(0, 4)}`;
  if (!end || end === start) return startLabel;
  const endLabel = `${formatShort(end)} ${end.slice(0, 4)}`;
  return `${startLabel} – ${endLabel}`;
}

/** "Fri, 30 Oct" */
export function formatWeekday(iso: string): string {
  const d = parseDate(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "14" or "14–15" */
export function dayRange(e: CampusEvent): string {
  const s = parseDate(e.start);
  if (!e.end || e.end === e.start) return String(s.getDate());
  return `${s.getDate()}–${parseDate(e.end).getDate()}`;
}

export function timeAgo(iso: string, nowMs: number): string {
  const mins = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

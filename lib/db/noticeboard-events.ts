import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Database } from '@/lib/db/database.types';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { todayISO } from '@/lib/dates';
import {
  EVENT_LOCATIONS,
  EVENT_MODES,
  PUBLISHABLE_EVENT_CATEGORIES,
  type PublishableEventCategory,
  type EventMode,
  type EventWhere,
  type NoticeboardCampusEvent,
  type NoticeboardEventInput,
} from '@/lib/types';

type EventCatalogRow = Database['public']['Tables']['event_catalog']['Row'];
type EventCatalogListingRow = Pick<
  EventCatalogRow,
  | 'id'
  | 'title'
  | 'category'
  | 'description'
  | 'mode'
  | 'event_where'
  | 'place'
  | 'start_date'
  | 'end_date'
  | 'registration_deadline'
  | 'capacity'
  | 'is_published'
>;

const EVENT_FIELDS =
  'id,title,category,description,mode,event_where,place,start_date,end_date,registration_deadline,capacity,is_published';

const publishableEventCategories = new Set<string>(PUBLISHABLE_EVENT_CATEGORIES);
const eventModes = new Set<string>(EVENT_MODES);
const eventLocations = new Set<string>(EVENT_LOCATIONS);

function isEventCategory(value: unknown): value is PublishableEventCategory {
  return typeof value === 'string' && publishableEventCategories.has(value);
}

function isEventMode(value: unknown): value is EventMode {
  return typeof value === 'string' && eventModes.has(value);
}

function isEventLocation(value: unknown): value is EventWhere {
  return typeof value === 'string' && eventLocations.has(value);
}

export class NoticeboardEventError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'NoticeboardEventError';
  }
}

function mapEvent(row: EventCatalogListingRow): NoticeboardCampusEvent {
  if (!row.start_date) {
    throw new Error(`Event ${row.id} is missing its start date.`);
  }
  if (!isEventCategory(row.category)) {
    throw new Error(`Event ${row.id} has an unsupported category.`);
  }
  if (!isEventMode(row.mode) || !isEventLocation(row.event_where)) {
    throw new Error(`Event ${row.id} has unsupported event details.`);
  }

  return {
    id: row.id,
    title: row.title,
    type: 'event',
    category: row.category,
    description: row.description,
    mode: row.mode,
    where: row.event_where,
    place: row.place,
    start: row.start_date,
    ...(row.end_date ? { end: row.end_date } : {}),
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    registerUrl: '#',
    isPublished: row.is_published,
  };
}

export async function getPublishedNoticeboardEvents(
  limit = 100,
): Promise<NoticeboardCampusEvent[]> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 100;
  const { data, error } = await supabase
    .from('event_catalog')
    .select(EVENT_FIELDS)
    .eq('noticeboard_managed', true)
    .eq('event_type', 'event')
    .eq('is_published', true)
    .gte('start_date', todayISO())
    .order('start_date', { ascending: true })
    .limit(safeLimit);

  if (error) throw new Error(`Unable to load published campus events: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

export async function getOrganizerNoticeboardEvents(): Promise<NoticeboardCampusEvent[]> {
  await requireOrganizer();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('event_catalog')
    .select(EVENT_FIELDS)
    .eq('noticeboard_managed', true)
    .eq('event_type', 'event')
    .not('start_date', 'is', null)
    .order('start_date', { ascending: true });

  if (error) throw new Error(`Unable to load organizer event listings: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new NoticeboardEventError(`${field} is required and must be at most ${maxLength} characters.`, 400);
  }
  return value.trim();
}

function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseNoticeboardEventInput(value: unknown): NoticeboardEventInput {
  if (!isRecord(value)) {
    throw new NoticeboardEventError('Event details must be sent as an object.', 400);
  }

  const title = requiredText(value.title, 'Title', 160);
  const description = requiredText(value.description, 'Description', 1200);
  const place = requiredText(value.place, 'Location', 160);
  const category = value.category;
  const mode = value.mode;
  const where = value.where;
  const start = value.start;
  const end = value.end;
  const registrationDeadline = value.registrationDeadline;
  const capacity = value.capacity;
  const isPublished = value.isPublished;

  if (!isEventCategory(category)) {
    throw new NoticeboardEventError('Choose a valid event category.', 400);
  }
  if (!isEventMode(mode)) {
    throw new NoticeboardEventError('Choose a valid event mode.', 400);
  }
  if (!isEventLocation(where)) {
    throw new NoticeboardEventError('Choose a valid campus location type.', 400);
  }
  if (!isISODate(start) || !isISODate(registrationDeadline)) {
    throw new NoticeboardEventError('Enter a valid event date and registration deadline.', 400);
  }
  if (end !== undefined && end !== '' && !isISODate(end)) {
    throw new NoticeboardEventError('Enter a valid event end date.', 400);
  }
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1 || capacity > 10000) {
    throw new NoticeboardEventError('Capacity must be a whole number between 1 and 10,000.', 400);
  }
  if (typeof isPublished !== 'boolean') {
    throw new NoticeboardEventError('Choose whether to publish this event.', 400);
  }

  const endDate = typeof end === 'string' && end ? end : undefined;
  if (endDate && endDate < start) {
    throw new NoticeboardEventError('The event end date cannot be before its start date.', 400);
  }
  if (registrationDeadline > start) {
    throw new NoticeboardEventError('The registration deadline cannot be after the event starts.', 400);
  }
  if (isPublished && start < todayISO()) {
    throw new NoticeboardEventError('Past events cannot be published as upcoming listings.', 400);
  }

  return {
    title,
    category,
    description,
    mode,
    where,
    place,
    start,
    ...(endDate ? { end: endDate } : {}),
    registrationDeadline,
    capacity,
    isPublished,
  };
}

async function requireOrganizer(): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new NoticeboardEventError('Sign in to manage event listings.', 401);
  if (currentUser.role !== 'organizer') {
    throw new NoticeboardEventError('Only organizers can manage event listings.', 403);
  }
}

function toCatalogFields(input: NoticeboardEventInput) {
  return {
    title: input.title,
    capacity: input.capacity,
    registration_deadline: input.registrationDeadline,
    event_type: 'event' as const,
    noticeboard_managed: true,
    category: input.category,
    description: input.description,
    mode: input.mode,
    event_where: input.where,
    place: input.place,
    start_date: input.start,
    end_date: input.end ?? null,
    is_published: input.isPublished,
    noticeboard_updated_at: new Date().toISOString(),
  };
}

export async function createNoticeboardEvent(
  input: NoticeboardEventInput,
): Promise<NoticeboardCampusEvent> {
  await requireOrganizer();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('event_catalog')
    .insert({ id: randomUUID(), ...toCatalogFields(input) })
    .select(EVENT_FIELDS)
    .single();

  if (error) throw new Error(`Unable to create campus event: ${error.message}`);
  return mapEvent(data);
}

export async function updateNoticeboardEvent(
  id: string,
  input: NoticeboardEventInput,
): Promise<NoticeboardCampusEvent> {
  await requireOrganizer();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('event_catalog')
    .update(toCatalogFields(input))
    .eq('id', id)
    .eq('noticeboard_managed', true)
    .eq('event_type', 'event')
    .select(EVENT_FIELDS)
    .maybeSingle();

  if (error) throw new Error(`Unable to update campus event: ${error.message}`);
  if (!data) throw new NoticeboardEventError('This event listing no longer exists.', 404);
  return mapEvent(data);
}

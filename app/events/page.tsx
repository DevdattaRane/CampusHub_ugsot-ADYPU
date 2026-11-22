import Link from 'next/link';
import PageHero from '@/components/PageHero';
import EventsBrowser from '@/components/EventsBrowser';
import { todayISO } from '@/lib/dates';
import { getCurrentUser } from '@/lib/auth';
import { getEventRegistrationStatuses, type EventRegistrationStatus } from '@/lib/db/events';
import { getPublishedNoticeboardEvents } from '@/lib/db/noticeboard-events';
import type { NoticeboardCampusEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events · CampusHub · UGSOT' };

export default async function EventsPage() {
  const currentUser = await getCurrentUser();
  let visibleEvents: NoticeboardCampusEvent[] = [];
  let eventListingsUnavailable = false;
  try {
    visibleEvents = await getPublishedNoticeboardEvents();
  } catch (error) {
    console.error('Unable to load published organizer event listings.', error);
    eventListingsUnavailable = true;
  }

  let statuses: EventRegistrationStatus[] = [];
  let registrationUnavailable = false;
  try {
    statuses = await getEventRegistrationStatuses(visibleEvents.map((event) => event.id));
  } catch (error) {
    console.error('Unable to load event registration availability.', error);
    registrationUnavailable = true;
  }

  return (
    <main className="container page">
      <PageHero
        tag="Hack · Learn · Win"
        before="All the "
        highlight="events"
        sub="Browse upcoming events published by campus organizers, and register for a new opportunity."
      />
      {currentUser?.role === 'organizer' && (
        <p style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
          <Link href="/organizer/events" className="btn btn--ghost">Manage published listings</Link>
        </p>
      )}
      <EventsBrowser events={visibleEvents} today={todayISO()} signedIn={Boolean(currentUser)}
        isOrganizer={currentUser?.role === 'organizer'}
        statuses={statuses} registrationUnavailable={registrationUnavailable}
        eventListingsUnavailable={eventListingsUnavailable} />
    </main>
  );
}

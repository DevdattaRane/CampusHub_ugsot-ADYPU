import PageHero from '@/components/PageHero';
import EventsBrowser from '@/components/EventsBrowser';
import { events } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { getCurrentUser } from '@/lib/auth';
import { getEventRegistrationStatuses, type EventRegistrationStatus } from '@/lib/db/events';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events · CampusHub · UGSOT' };

export default async function EventsPage() {
  const currentUser = await getCurrentUser();
  let statuses: EventRegistrationStatus[] = [];
  let registrationUnavailable = false;
  try {
    statuses = await getEventRegistrationStatuses(events.map((event) => event.id));
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
        sub="Find something to learn, build, or compete in. Pick a view and make a plan."
      />
      <EventsBrowser events={events} today={todayISO()} signedIn={Boolean(currentUser)}
        isOrganizer={currentUser?.role === 'organizer'}
        statuses={statuses} registrationUnavailable={registrationUnavailable} />
    </main>
  );
}

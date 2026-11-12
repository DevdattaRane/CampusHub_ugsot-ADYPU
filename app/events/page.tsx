import PageHero from '@/components/PageHero';
import EventsBrowser from '@/components/EventsBrowser';
import { events } from '@/lib/data';
import { todayISO } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events · CampusHub · UGSOT' };

export default function EventsPage() {
  return (
    <main className="container page">
      <PageHero
        tag="Hack · Learn · Win"
        before="All the "
        highlight="events"
        sub="Find something to learn, build, or compete in. Pick a view and make a plan."
      />
      <EventsBrowser events={events} today={todayISO()} />
    </main>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import OrganizerEventManager from '@/components/noticeboard/OrganizerEventManager';
import { getCurrentUser } from '@/lib/auth';
import { getOrganizerNoticeboardEvents } from '@/lib/db/noticeboard-events';
import type { NoticeboardCampusEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Event Manager · CampusHub · UGSOT',
  description: 'Publish verified campus event listings to the public Noticeboard.',
};

export default async function OrganizerEventsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth/sign-in');

  if (currentUser.role !== 'organizer') {
    return (
      <main className="container page">
        <PageHero
          tag="Access restricted"
          before="Event "
          highlight="Manager"
          sub="Only verified campus organizers can create and publish public event listings."
        />
        <div className="card" style={{ maxWidth: 560, margin: '24px auto', padding: 28 }}>
          <h2>Organizer access required</h2>
          <p>Sign in with an organizer account to manage Noticeboard events.</p>
          <Link href="/events" className="btn btn--primary">Browse events</Link>
        </div>
      </main>
    );
  }

  let initialEvents: NoticeboardCampusEvent[] = [];
  let loadError = '';
  try {
    initialEvents = await getOrganizerNoticeboardEvents();
  } catch (error) {
    console.error('Unable to load organizer event listings.', error);
    loadError = 'Event listings could not be loaded. Check the Supabase configuration and apply the Noticeboard event migration.';
  }

  return (
    <main className="container page">
      <PageHero
        tag="Public Noticeboard · Organizer tools"
        before="Campus "
        highlight="Event Manager"
        sub="Create a draft, then publish it when the event details are confirmed. Published listings appear on the public Noticeboard and Events page."
      />
      <OrganizerEventManager initialEvents={initialEvents} loadError={loadError} />
    </main>
  );
}

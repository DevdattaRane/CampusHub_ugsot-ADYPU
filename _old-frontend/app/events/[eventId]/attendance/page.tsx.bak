import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEvent } from '@/lib/data';
import { getEventAttendanceDetails } from '@/lib/db/events';
import AttendanceTracker from '@/components/AttendanceTracker';
import PageHero from '@/components/PageHero';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  return {
    title: event ? `Attendance · ${event.title} · CampusHub` : 'Attendance · CampusHub',
  };
}

export default async function EventAttendancePage({ params }: Props) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  if (!event) notFound();

  const currentUser = await getCurrentUser();

  // If not signed in, redirect to sign in
  if (!currentUser) {
    redirect(`/auth/sign-in?next=/events/${eventId}/attendance`);
  }

  // Enforce organizer role
  if (currentUser.role !== 'organizer') {
    return (
      <main className="container page">
        <Link href={`/events/${eventId}`} className="back-link">
          ← Back to {event.title}
        </Link>
        <PageHero
          tag="Access Restricted"
          before=""
          highlight="Organizer Access Required"
          sub="Attendance tracking and roll-call are only available to event organizers."
        />
        <div className="card" style={{ maxWidth: 600, margin: '24px auto', padding: 28 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>🔒</span>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Permission Denied</h2>
              <p style={{ margin: '0 0 16px 0', opacity: 0.85, lineHeight: 1.5 }}>
                You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.email}) with the role of <strong>{currentUser.role}</strong>.
                Only accounts with <code>profiles.role = &apos;organizer&apos;</code> are authorized to view or edit attendance.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href={`/events/${eventId}`} className="btn btn--primary">
                  Return to event page
                </Link>
                <Link href="/events" className="btn btn--ghost">
                  Browse all events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Load attendance data
  let attendanceData = null;
  let loadError = '';

  try {
    attendanceData = await getEventAttendanceDetails(eventId);
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    loadError = error instanceof Error ? error.message : 'Unable to load attendance records.';
  }

  return (
    <main className="container page attendance-page">
      <Link href={`/events/${eventId}`} className="back-link">
        ← Back to {event.title}
      </Link>

      {loadError ? (
        <div className="card form-error" role="alert" style={{ padding: 20, marginTop: 16 }}>
          <h3>Unable to load attendance tracker</h3>
          <p>{loadError}</p>
        </div>
      ) : attendanceData ? (
        <AttendanceTracker event={attendanceData.event} initialRecords={attendanceData.records} />
      ) : null}
    </main>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import HackathonAnnouncements from '@/components/HackathonAnnouncements';
import HackathonTeamRegistration from '@/components/HackathonTeamRegistration';
import PageHero from '@/components/PageHero';
import { getCurrentUser } from '@/lib/auth';
import { events, getEvent, students } from '@/lib/data';
import { dayRange, formatShort, parseDate, MONTHS_SHORT } from '@/lib/dates';
import { getHackathonPageData, type HackathonPageData } from '@/lib/db/events';

type Props = { params: Promise<{ eventId: string }> };

function getTodayInIndia(): string {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = dateParts.find((item) => item.type === 'year')?.value;
  const month = dateParts.find((item) => item.type === 'month')?.value;
  const day = dateParts.find((item) => item.type === 'day')?.value;
  if (!year || !month || !day) throw new Error('Unable to determine today’s date in India.');
  return `${year}-${month}-${day}`;
}

export async function generateStaticParams() {
  return events.filter((event) => event.type === 'hackathon')
    .map((event) => ({ eventId: event.id }));
}

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  return { title: event ? `${event.title} · CampusHub · UGSOT` : 'Hackathon · CampusHub · UGSOT' };
}

export default async function HackathonPage({ params }: Props) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  if (!event || event.type !== 'hackathon') notFound();

  const currentUser = await getCurrentUser();
  let data: HackathonPageData | null = null;
  let dataError = '';
  try {
    data = await getHackathonPageData(eventId);
  } catch (error) {
    console.error('Unable to load hackathon details.', error);
    dataError = 'Hackathon announcements and team registration are temporarily unavailable. Check the Supabase configuration and migrations.';
  }

  const teamSizeMin = data?.teamSizeMin ?? event.teamSizeMin;
  const teamSizeMax = data?.teamSizeMax ?? event.teamSizeMax;
  const rules = data?.rules ?? event.rules;

  return (
    <main className="container page hackathon-page">
      <Link href="/events" className="back-link">← All events</Link>
      <PageHero
        tag="Hackathon"
        before=""
        highlight={event.title}
        sub={`${event.category} · ${event.mode} · ${event.where} · ${event.place}`}
      />
      {currentUser?.role === 'organizer' && (
        <section
          className="card"
          style={{
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            background: 'var(--card)',
            border: '2px solid var(--accent)',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Organizer Tools
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: 18 }}>Attendance & Check-in</h3>
          </div>
          <Link
            href={`/events/${eventId}/attendance`}
            className="btn btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>📋</span> Take Attendance & Roll Call
          </Link>
        </section>
      )}
      {dataError && <p className="form-error" role="alert">{dataError}</p>}

      <section className="card hackathon-overview" aria-labelledby="hackathon-overview-title">
        <h2 id="hackathon-overview-title" className="card__title">Event details</h2>
        <dl className="hackathon-facts">
          <div>
            <dt>Date</dt>
            <dd>{MONTHS_SHORT[parseDate(event.start).getMonth()]} {dayRange(event)}, {parseDate(event.start).getFullYear()}</dd>
          </div>
          <div>
            <dt>Registration deadline</dt>
            <dd>{formatShort(data?.registrationDeadline ?? event.registrationDeadline)}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>{data?.capacity ?? event.capacity} participants</dd>
          </div>
          <div>
            <dt>Team size</dt>
            <dd>{teamSizeMin}–{teamSizeMax} members, including the leader</dd>
          </div>
        </dl>
      </section>

      <section className="hackathon-details-grid" aria-label="Hackathon theme, prize and rules">
        <article className="card hackathon-panel">
          <p className="eyebrow">The challenge</p>
          <h2 className="card__title">Theme</h2>
          <p>{data?.theme ?? event.theme}</p>
        </article>
        <article className="card hackathon-panel">
          <p className="eyebrow">What you can win</p>
          <h2 className="card__title">Prizes</h2>
          <p>{data?.prize ?? event.prize}</p>
        </article>
        <article className="card hackathon-panel">
          <p className="eyebrow">Before you build</p>
          <h2 className="card__title">Rules</h2>
          {rules.length ? (
            <ul className="hackathon-rules">
              {rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          ) : (
            <p className="empty-note">No specific rules have been published yet.</p>
          )}
        </article>
      </section>

      {data ? (
        <>
          <HackathonAnnouncements eventId={eventId} announcements={data.announcements}
            isOrganizer={currentUser?.role === 'organizer'} />
          <HackathonTeamRegistration eventId={eventId} registrationDeadline={data.registrationDeadline}
            registrationClosed={data.registrationDeadline < getTodayInIndia()}
            teamSizeMin={data.teamSizeMin}
            teamSizeMax={data.teamSizeMax} teams={data.teams}
            studentsLookingForTeam={students.filter((student) => student.lookingForTeam)}
            currentUserEmail={currentUser?.email ?? null} />
        </>
      ) : (
        <section className="card hackathon-panel" aria-label="Announcements and team registration unavailable">
          <p>Connect Supabase and apply the hackathon migration to view announcements or register a team.</p>
        </section>
      )}
    </main>
  );
}

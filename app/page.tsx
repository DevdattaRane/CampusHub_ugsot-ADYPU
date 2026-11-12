import Link from 'next/link';
import HomeCalendar from '@/components/HomeCalendar';
import TeammateCard from '@/components/TeammateCard';
import Avatar from '@/components/Avatar';
import { getStudent, CURRENT_USER_ID, events, highlights, posts } from '@/lib/data';
import { typeColors, tagColors } from '@/lib/colors';
import { eventDays, formatShort, formatWeekday, todayISO, toISO } from '@/lib/dates';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home · CampusHub · UGSOT' };

export default function HomePage() {
  const today = todayISO();
  const todayDate = new Date(`${today}T00:00:00`);
  const daysUntilSunday = (7 - todayDate.getDay()) % 7;
  const weekEndDate = new Date(todayDate);
  weekEndDate.setDate(todayDate.getDate() + daysUntilSunday);
  const weekEnd = toISO(weekEndDate);
  const todayEvents = events.filter((event) => eventDays(event).some((day) => toISO(day) === today));
  const todayEventIds = new Set(todayEvents.map((event) => event.id));
  const weekEvents = events
    .filter((event) => !todayEventIds.has(event.id) && eventDays(event).some((day) => {
      const iso = toISO(day);
      return iso > today && iso <= weekEnd;
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const latestPosts = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const me = getStudent(CURRENT_USER_ID);
  const firstName = me?.name.split(' ')[0] ?? 'there';

  return (
    <main className="container page home-page">
      <header className="home-welcome">
        <div>
          <Tag>{formatWeekday(today)}</Tag>
          <h1 className="hero__title">Hey {firstName}, ready to <span className="hero__highlight">make</span> today?</h1>
          <p className="hero__sub">Your people, events and campus conversations, all in one place.</p>
        </div>
        <Link href="/events" className="btn btn--primary">Explore events</Link>
      </header>

      <section aria-labelledby="today-title" className="today-panel">
        <div className="today-panel__head">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="today-title" className="section-title">Today on campus</h2>
          </div>
          <span className="today-date">{formatShort(today)}</span>
        </div>
        {todayEvents.length ? (
          <div className="today-list">
            {todayEvents.map((event) => (
              <Link key={event.id} href="/events" className="today-event" style={{ background: typeColors[event.type].bg }}>
                <span className="today-event__copy">
                  <strong>{event.title}</strong>
                  <span>{event.place} · {event.mode}</span>
                </span>
                <Tag>{event.type}</Tag>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="today-empty">
            <strong>No events on your calendar today.</strong>
            <span>Here’s what’s coming up this week.</span>
          </Card>
        )}

        <div className="week-preview">
          <div className="section-head">
            <h3 className="week-preview__title">Up next this week</h3>
            <Link href="/events" className="link-more">All events →</Link>
          </div>
          {weekEvents.length ? (
            <div className="week-preview__list">
              {weekEvents.map((event) => (
                <Link key={event.id} href="/events" className="week-event">
                  <span className="week-event__date">{formatShort(event.start)}</span>
                  <span className="week-event__name">{event.title}</span>
                  <Tag style={{ background: typeColors[event.type].bg }}>{event.type}</Tag>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-note">No more events this week. Check back soon.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="posts-title" className="home-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">From your community</p>
            <h2 id="posts-title" className="section-title">What’s happening</h2>
          </div>
          <Link href="/community" className="link-more">Open community →</Link>
        </div>
        {latestPosts.length ? (
          <div className="post-grid">
            {latestPosts.map((post) => {
              const author = getStudent(post.authorId);
              return (
                <Link key={post.id} href="/community" className="post-card">
                  <Tag style={{ background: tagColors[post.tag].bg }}>{post.tag}</Tag>
                  <span className="post-card__title">{post.title}</span>
                  <span className="post-card__meta">{author?.name ?? 'Campus student'} · {post.replies} replies</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="empty">No community posts yet. Start the first conversation.</p>
        )}
      </section>

      <section aria-labelledby="highlights-title" className="home-grid">
        <Card className="home-highlights">
          <div className="section-head">
            <div>
              <p className="eyebrow">Good things happen here</p>
              <h2 id="highlights-title" className="card__title">Campus highlights</h2>
            </div>
          </div>
          {highlights.length ? highlights.map((highlight) => {
            const student = getStudent(highlight.studentId);
            if (!student) return null;
            return (
              <div key={highlight.id} className="highlight">
                <Avatar studentId={student.id} name={student.name} />
                <div className="highlight__copy">
                  <Tag>{highlight.badge}</Tag>
                  <p className="highlight__text">
                    <Link href={`/students/${student.id}`}>{student.name}</Link> {highlight.text}
                  </p>
                </div>
              </div>
            );
          }) : <p className="empty-note">No highlights yet. Your next win could be here.</p>}
        </Card>
        <TeammateCard />
      </section>

      <details className="home-calendar">
        <summary>Browse the full event calendar</summary>
        <HomeCalendar events={events} today={today} />
      </details>
    </main>
  );
}

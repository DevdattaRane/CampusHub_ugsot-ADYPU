import Link from 'next/link';
import HomeCalendar from '@/components/HomeCalendar';
import TeammateCard from '@/components/TeammateCard';
import Avatar from '@/components/Avatar';
import { Plus, Star } from '@/components/icons';
import { CURRENT_USER_ID, events, getStudent, highlights, posts } from '@/lib/data';
import { pastel, tagColors } from '@/lib/colors';
import { formatWeekday, todayISO } from '@/lib/dates';

// Rendered per request so "today" is always current.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const today = todayISO();
  const me = getStudent(CURRENT_USER_ID);
  const firstName = me?.name.split(' ')[0] ?? 'there';
  const latestPosts = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  return (
    <main className="container page">
      <section className="hero">
        <div>
          <span className="tag">{formatWeekday(today)}</span>
          <h1 className="hero__title">
            Hey {firstName}, here’s what’s on <span className="hero__highlight">campus</span>
          </h1>
        </div>
        <Link href="/events" className="btn btn--primary"><Plus />Submit an event</Link>
      </section>

      <div className="home-grid">
        <div className="home-grid__main">
          <HomeCalendar events={events} today={today} />
        </div>

        <aside className="home-grid__aside">
          <section aria-labelledby="highlights-title" className="card">
            <div className="section-head section-head--icon">
              <span aria-hidden="true" className="icon-tile"><Star /></span>
              <h2 id="highlights-title" className="card__title">Daily highlights</h2>
            </div>
            {highlights.map((h, i) => {
              const s = getStudent(h.studentId);
              if (!s) return null;
              const c = pastel[i % pastel.length];
              return (
                <div key={h.id} className="highlight">
                  <Avatar studentId={s.id} name={s.name} />
                  <div style={{ minWidth: 0 }}>
                    <span className="badge" style={{ background: c.bg, color: c.fg }}>{h.badge}</span>
                    <p className="highlight__text">
                      <Link href={`/students/${s.id}`} style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none' }}>{s.name}</Link> {h.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <TeammateCard />
        </aside>
      </div>

      <section aria-labelledby="whatsup-title" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="section-head">
          <h2 id="whatsup-title" className="section-title">What’s up on campus</h2>
          <Link href="/community" className="link-more">Open community →</Link>
        </div>
        <div className="post-grid">
          {latestPosts.map((p) => {
            const author = getStudent(p.authorId);
            return (
              <Link key={p.id} href="/community" className="post-card">
                <span className="chip" style={{ background: tagColors[p.tag].bg, color: tagColors[p.tag].fg }}>{p.tag}</span>
                <span className="post-card__title">{p.title}</span>
                <span className="post-card__meta">{author?.name} · {p.replies} replies</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

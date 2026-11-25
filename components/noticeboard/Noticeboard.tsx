import Link from 'next/link';
import { noticeboardAchievementSamples } from '@/data/noticeboard.sample';
import { getPublishedNoticeboardEvents } from '@/lib/db/noticeboard-events';
import { formatEventDateRange } from '@/lib/dates';
import type { NoticeboardCampusEvent } from '@/lib/types';
import styles from './noticeboard.module.css';

export default async function Noticeboard() {
  let events: NoticeboardCampusEvent[] = [];
  let eventLoadError = false;
  try {
    events = await getPublishedNoticeboardEvents();
  } catch (error) {
    console.error('Unable to load public Noticeboard events.', error);
    eventLoadError = true;
  }

  return (
    <main className={styles.board}>
      <header className={styles.topBar}>
        <Link href="/welcome" className={styles.wordmark} aria-label="CampusHub home">
          <span className={styles.wordmarkMark} aria-hidden="true">U</span>
          <span>
            <strong>CampusHub</strong>
            <small>UGSOT · ADYPU</small>
          </span>
        </Link>
        <Link href="/events" className={styles.topLink}>
          Browse events <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="noticeboard-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>CAMPUS SIGNALS / PUBLIC BOARD</p>
          <h1 id="noticeboard-title">
            Notice<span>board</span><sup>01</sup>
          </h1>
          <p className={styles.heroDescription}>
            What’s happening around campus, and the good work worth celebrating.
          </p>
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <span className={styles.heroGlyph}>U</span>
          <span className={styles.heroCaption}>LEARN · BUILD · SHARE</span>
        </div>
      </section>

      <aside className={styles.sampleNotice} aria-label="Sample content notice">
        <span className={styles.sampleNoticeLabel}>RECOGNITIONS PREVIEW</span>
        <p>
          Event listings are published by campus organizers. Community recognitions below remain
          illustrative previews; no real student names or achievement records are shown.
        </p>
      </aside>

      <section className={styles.section} aria-labelledby="events-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>01 / CAMPUS CALENDAR</p>
            <h2 id="events-title">Coming up</h2>
          </div>
          <p className={styles.sectionIntro}>
            Upcoming events published by campus organizers, with dates and locations.
          </p>
        </div>

        <div className={styles.eventGrid}>
          {eventLoadError ? (
            <p className={styles.eventMessage} role="alert">
              Live event listings are temporarily unavailable. Please try again later.
            </p>
          ) : events.length ? (
            events.map((event, index) => (
              <article className={styles.eventCard} data-tone={index % 3} key={event.id}>
                <div className={styles.cardTopline}>
                  <span className={styles.category}>{event.category}</span>
                  <span className={styles.sampleBadge}>PUBLISHED</span>
                </div>
                <h3>{event.title}</h3>
                <p className={styles.cardDescription}>{event.description}</p>
                <dl className={styles.eventFacts}>
                  <div>
                    <dt>WHEN</dt>
                    <dd>{formatEventDateRange(event.start, event.end)}</dd>
                  </div>
                  <div>
                    <dt>WHERE</dt>
                    <dd>{event.place}</dd>
                  </div>
                </dl>
                <Link className={styles.eventCardLink} href={`/events#event-${event.id}`}>
                  View registration details <span aria-hidden="true">↗</span>
                </Link>
                <span className={styles.cardIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </article>
            ))
          ) : (
            <p className={styles.eventMessage}>No upcoming events have been published yet.</p>
          )}
        </div>

        <div className={styles.sectionAction}>
          <span>Looking for current listings?</span>
          <Link href="/events">Explore the events page <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="achievements-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>02 / COMMUNITY NOTES</p>
            <h2 id="achievements-title">Good work, shared</h2>
          </div>
          <p className={styles.sectionIntro}>
            Example recognitions only; no real student names or achievement records are shown.
          </p>
        </div>

        <div className={styles.achievementGrid}>
          {noticeboardAchievementSamples.map((achievement, index) => (
            <article className={styles.achievementCard} key={achievement.id}>
              <div className={styles.achievementMark} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <div className={styles.cardTopline}>
                  <span className={styles.category}>{achievement.category}</span>
                  <span className={styles.sampleBadge}>SAMPLE</span>
                </div>
                <h3>{achievement.title}</h3>
                <p className={styles.cardDescription}>{achievement.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.sectionAction}>
          <span>See community contributions</span>
          <Link href="/leaderboard">Visit the leaderboard <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/welcome">← Back to CampusHub</Link>
        <span>UGSOT · ADYPU</span>
      </footer>
    </main>
  );
}

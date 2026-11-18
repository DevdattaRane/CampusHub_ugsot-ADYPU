'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GlassPanel from '@/components/effects/GlassPanel';
import LiquidLogo from '@/components/effects/LiquidLogo';
import ShaderBackground from '@/components/effects/ShaderBackground';
import { formatShort, MONTHS_SHORT, parseDate } from '@/lib/dates';
import type { CampusEvent } from '@/lib/types';
import styles from './welcome.module.css';

export type WelcomeEvent = Pick<CampusEvent, 'id' | 'title' | 'start' | 'end' | 'category' | 'place'>;

const destinations = [
  {
    href: '/projects',
    title: 'Projects',
    description: 'Explore what students are building and share your own work.',
  },
  {
    href: '/events',
    title: 'Events',
    description: 'Find workshops, meetups, sprints and campus events.',
  },
  {
    href: '/community',
    title: 'Community',
    description: 'Ask questions, trade ideas and help each other move forward.',
  },
  {
    href: '/students',
    title: 'Students',
    description: 'Meet people by interests, skills and what they want to learn.',
  },
  {
    href: '/opportunities',
    title: 'Opportunities',
    description: 'Browse ways to contribute, collaborate and grow.',
  },
  {
    href: '/leaderboard',
    title: 'Leaderboard',
    description: 'See community contributions and helpful answers.',
  },
];

const projectPrompts = [
  {
    className: styles.projectBlue,
    title: 'Make a start',
    description: 'Bring a first draft, a question or a rough idea.',
  },
  {
    className: styles.projectInk,
    title: 'Build with others',
    description: 'Find people to shape an idea into something useful.',
  },
  {
    className: styles.projectMint,
    title: 'Share what you learn',
    description: 'Show your work and make progress visible.',
  },
];

function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 12);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  const content = (
    <>
      <Link href="/welcome" className={styles.brand} aria-label="UGSOT Campus Hub welcome page">
        <LiquidLogo size={34} allowShader={false} />
        <span>UGSOT Campus Hub</span>
      </Link>
      <nav className={styles.navigation} aria-label="Explore CampusHub">
        <Link href="/projects">Projects</Link>
        <Link href="/events">Events</Link>
        <Link href="/community">Community</Link>
        <Link href="/students">Students</Link>
      </nav>
      <div className={styles.headerActions}>
        <Link href="/auth/sign-in" className={styles.signIn}>Sign in</Link>
        <Link href="/auth/register" className={`pill r magnetic ${styles.joinButton}`} data-magnetic>
          Join the Hub
        </Link>
      </div>
    </>
  );

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      {scrolled
        ? <GlassPanel className={styles.headerInner}>{content}</GlassPanel>
        : <div className={styles.headerInner}>{content}</div>}
    </header>
  );
}

function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className={`sh ${styles.sectionHeading}`}>
      <h2 id={id} className={styles.maskTitle} data-reveal suppressHydrationWarning>
        <span>{title}</span>
      </h2>
      {note && <p className={styles.sectionNote}>{note}</p>}
    </div>
  );
}

function EventDate({ event }: { event: WelcomeEvent }) {
  const date = parseDate(event.start);
  return (
    <time className={styles.eventDate} dateTime={event.start}>
      <span className="num" data-parallax="0.02" suppressHydrationWarning>
        {event.end ? `${date.getDate()}–${parseDate(event.end).getDate()}` : date.getDate()}
      </span>
      <span className={styles.eventMonth}>{MONTHS_SHORT[date.getMonth()]}</span>
      <span className="sr-only">{formatShort(event.start)}</span>
    </time>
  );
}

export default function WelcomeExperience({ upcomingEvents }: { upcomingEvents: WelcomeEvent[] }) {
  const nextEvent = upcomingEvents[0];

  return (
    <div className={styles.welcomePage}>
      <LandingHeader />
      <main>
        <section className={styles.hero} aria-labelledby="welcome-title">
          <div className={styles.heroCopy} data-reveal suppressHydrationWarning>
            <p className={styles.kicker}>A place to learn, build and share</p>
            <h1 id="welcome-title">Build. Connect. Collaborate. Grow.</h1>
            <p className={styles.heroDescription}>
              Find your people, discover campus events and bring your next idea to life with UGSOT.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth/register" className="pill r magnetic" data-magnetic>Join the Hub</Link>
              <Link href="/projects" className="pill magnetic" data-magnetic>Explore projects</Link>
            </div>
          </div>

          <div className={styles.heroVisual} data-reveal suppressHydrationWarning>
            <ShaderBackground className={styles.heroShader}>
              <span className={`${styles.blob} ${styles.blobBlue}`} aria-hidden="true" />
              <span className={`${styles.blob} ${styles.blobCoral}`} aria-hidden="true" />
              <span className={`${styles.blob} ${styles.blobMint}`} aria-hidden="true" />
              <div className={styles.heroLogo} data-parallax="0.025" aria-hidden="true" suppressHydrationWarning>
                <LiquidLogo size={190} allowShader={false} />
              </div>
              <GlassPanel
                className={styles.nextCard}
                role="group"
                aria-labelledby="next-up-title"
              >
                <p className={styles.cardEyebrow}>
                  {nextEvent ? `Next up · ${formatShort(nextEvent.start)}` : 'Next up'}
                </p>
                <h2 id="next-up-title">{nextEvent?.title ?? 'Event preview unavailable'}</h2>
                <p className={styles.nextMeta}>
                  {nextEvent
                    ? `${nextEvent.place} · ${nextEvent.category}`
                    : 'Verified upcoming event details will appear here when available.'}
                </p>
                <Link
                  href={nextEvent ? `/events/${nextEvent.id}` : '/events'}
                  className={`pill sm ${styles.cardLink}`}
                >
                  {nextEvent ? 'View event' : 'Explore events'} <span aria-hidden="true">→</span>
                </Link>
              </GlassPanel>
            </ShaderBackground>
          </div>
        </section>

        <div className={`mq ${styles.ticker}`} aria-hidden="true">
          <div data-marquee-track aria-hidden="true" suppressHydrationWarning>
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index}>Build. Connect. Collaborate. Grow. · </span>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <section className={styles.section} aria-labelledby="explore-title">
            <SectionHeading id="explore-title" title="What you can do here" note="Explore the hub" />
            <div className={styles.destinationRows}>
              {destinations.map((destination, index) => (
                <Link
                  key={destination.href}
                  href={destination.href}
                  className={styles.destinationRow}
                  data-reveal
                  suppressHydrationWarning
                >
                  <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.rowTitle}>{destination.title}</span>
                  <span className={styles.rowDescription}>{destination.description}</span>
                  <span className={styles.rowArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="events-title">
            <SectionHeading id="events-title" title="Happening soon" note="Events on campus" />
            {upcomingEvents.length ? (
              <div className={styles.eventList}>
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className={styles.eventRow}
                    data-reveal
                    suppressHydrationWarning
                  >
                    <EventDate event={event} />
                    <span className={styles.eventCopy}>
                      <strong>{event.title}</strong>
                      <span>{event.place}</span>
                    </span>
                    <span className={styles.eventCategory}>{event.category}</span>
                    <span className={styles.rowArrow} aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.emptyNote}>Verified upcoming event listings are not available to preview yet.</p>
            )}
          </section>

          <section className={styles.section} aria-labelledby="projects-title">
            <SectionHeading
              id="projects-title"
              title="Built by students"
              note="Project spotlights will appear here when curated project data is available."
            />
            <div className={styles.projectTiles}>
              {projectPrompts.map((prompt) => (
                <Link
                  key={prompt.title}
                  href="/projects"
                  className={`${styles.projectTile} ${prompt.className}`}
                  data-reveal
                  suppressHydrationWarning
                >
                  <span className={styles.tileMark} aria-hidden="true">{prompt.title[0]}</span>
                  <span>
                    <strong>{prompt.title}</strong>
                    <span>{prompt.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="steps-title">
            <SectionHeading id="steps-title" title="How it works" note="Three simple steps" />
            <div className={styles.steps}>
              <article className={styles.step} data-reveal suppressHydrationWarning>
                <span>01</span>
                <h3>Join</h3>
                <p>Create an account and become part of the UGSOT community.</p>
              </article>
              <article className={styles.step} data-reveal suppressHydrationWarning>
                <span>02</span>
                <h3>Build a profile</h3>
                <p>Share what you are learning and the kind of work you want to do.</p>
              </article>
              <article className={styles.step} data-reveal suppressHydrationWarning>
                <span>03</span>
                <h3>Find your people</h3>
                <p>Meet collaborators, join events and contribute to campus projects.</p>
              </article>
            </div>
          </section>
        </div>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <ShaderBackground variant="grain" className={styles.finalShader}>
            <div className={styles.finalContent} data-reveal suppressHydrationWarning>
              <p className={styles.kicker}>Your next idea can start here</p>
              <h2 id="final-cta-title">Make something that brings people together.</h2>
              <div className={styles.heroActions}>
                <Link href="/auth/register" className="pill r magnetic" data-magnetic>Join the Hub</Link>
                <Link href="/auth/sign-in" className="pill magnetic" data-magnetic>Sign in</Link>
              </div>
            </div>
          </ShaderBackground>
        </section>
      </main>
    </div>
  );
}

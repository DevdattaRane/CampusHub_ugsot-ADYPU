import Link from 'next/link';
import Grain from './Grain';
import HeroFluid from './HeroFluid';
import LiveClock from './LiveClock';
import LogoMark from './LogoMark';
import Nav from './Nav';
import ScrollEffects from './ScrollEffects';
import SmoothScroll from './SmoothScroll';
import styles from './welcome.module.css';

const statementText = 'CampusHub helps UGSOT students find opportunities, join campus events, learn with peers, and share their projects.';
const statementWords = statementText.split(' ');

const destinations = [
  {
    number: '01',
    href: '/opportunities',
    label: 'Opportunities',
    description: 'Find internships, open-source programs, hackathons and more.',
  },
  {
    number: '02',
    href: '/leaderboard',
    label: 'Leaderboard',
    description: 'See community contributions and helpful answers.',
  },
  {
    number: '03',
    href: '/events',
    label: 'Events',
    description: 'Explore workshops, meetups, sprints and campus events.',
  },
];

const showcases = [
  {
    number: '01',
    href: '/opportunities',
    eyebrow: 'Find a next step',
    title: 'Opportunities',
    description: 'Browse internships, open-source programs, hackathons, fellowships and competitions.',
    details: ['Internships', 'Open source', 'Hackathons'],
    theme: styles.showcaseBlue,
  },
  {
    number: '02',
    href: '/community',
    eyebrow: 'Learn together',
    title: 'Community',
    description: 'Ask questions, share discussions and find answers from other students.',
    details: ['Questions', 'Discussions', 'Announcements'],
    theme: styles.showcaseInk,
  },
  {
    number: '03',
    href: '/projects',
    eyebrow: 'Make work visible',
    title: 'Projects',
    description: 'Show what you are building, explore project work and find collaborators.',
    details: ['Project showcase', 'GitHub links', 'Collaboration'],
    theme: styles.showcaseMint,
  },
];

export default function WelcomeExperience() {
  return (
    <SmoothScroll>
      <div className={styles.welcomePage}>
        <Grain />
        <Nav />
        <main>
        <section className={styles.hero} aria-labelledby="welcome-title" data-nav-theme="light">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> UGSOT · ADYPU</p>
            <h1 id="welcome-title">Build your next idea <span>here.</span></h1>
            <p className={styles.heroDescription}>
              Find opportunities, meet collaborators and grow your work with the UGSOT community.
            </p>
            <div className={styles.heroActions}>
              <Link href="/auth/sign-in" className={styles.primaryButton}>Sign in <span aria-hidden="true">↗</span></Link>
              <Link href="/opportunities" className={styles.secondaryButton}>Browse opportunities</Link>
            </div>
            <LiveClock />
          </div>

          <HeroFluid>
            <div className={styles.visualGrid} aria-hidden="true" />
            <span className={`${styles.orb} ${styles.orbBlue}`} data-parallax aria-hidden="true" />
            <span className={`${styles.orb} ${styles.orbCoral}`} data-parallax aria-hidden="true" />
            <span className={`${styles.orb} ${styles.orbMint}`} data-parallax aria-hidden="true" />
            <div className={styles.visualLogo} data-parallax aria-hidden="true">
              <LogoMark large />
            </div>
            <div className={styles.visualLabel}>
              <span>CampusHub</span>
              <span>Learn · Build · Share</span>
            </div>
            <div className={styles.visualCard}>
              <p>YOUR CAMPUS, CONNECTED</p>
              <strong>Ideas move further together.</strong>
              <Link href="/community">Explore the community <span aria-hidden="true">↗</span></Link>
            </div>
          </HeroFluid>
        </section>

        <div className={styles.signalBar} data-nav-theme="dark" aria-label="CampusHub connects students through learning, building and sharing">
          <span>Learn with others</span>
          <span aria-hidden="true">✳</span>
          <span>Build in the open</span>
          <span aria-hidden="true">✳</span>
          <span>Share what you know</span>
        </div>

        <section
          className={styles.statement}
          aria-labelledby="statement-title"
          data-nav-theme="dark"
          data-pinned-statement
        >
          <div className={styles.statementInner}>
            <p className={styles.sectionEyebrow}>A campus community for people who make things</p>
            <h2 id="statement-title">Find your people. Build together.</h2>
            <p className={styles.statementText} aria-label={statementText}>
              {statementWords.map((word, index) => (
                <span key={`${word}-${index}`} data-statement-word aria-hidden="true">
                  {word}{index < statementWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
          <span className={styles.statementMark} data-parallax aria-hidden="true">U</span>
        </section>

        <section className={styles.section} aria-labelledby="destinations-title" data-nav-theme="light">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>Start anywhere</p>
              <h2 id="destinations-title">What you can do here</h2>
            </div>
            <p>Three ways to take your next step.</p>
          </div>
          <div className={styles.destinationGrid}>
            {destinations.map((destination) => (
              <Link
                href={destination.href}
                className={styles.destinationCard}
                key={destination.number}
              >
                <span className={styles.destinationNumber}>{destination.number}</span>
                <span className={styles.destinationArrow} aria-hidden="true">↗</span>
                <span className={styles.destinationLabel}>{destination.label}</span>
                <span className={styles.destinationDescription}>{destination.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.showcaseSection}`}
          aria-labelledby="showcase-title"
          data-nav-theme="light"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>A closer look</p>
              <h2 id="showcase-title">A hub for your next move</h2>
            </div>
            <p>Explore the spaces that help campus ideas move forward.</p>
          </div>
          <div className={styles.showcaseGrid}>
            {showcases.map((showcase) => (
              <Link
                href={showcase.href}
                className={`${styles.showcaseCard} ${showcase.theme}`}
                key={showcase.number}
              >
                <span className={styles.showcaseTopline}>
                  <span>{showcase.eyebrow}</span>
                  <span>{showcase.number}</span>
                </span>
                <span className={styles.showcasePreview} data-parallax aria-hidden="true">
                  <span className={styles.previewTitle}>{showcase.title}</span>
                  <span className={styles.previewDetails}>
                    {showcase.details.map((detail) => <span key={detail}>{detail}</span>)}
                  </span>
                </span>
                <span className={styles.showcaseCopy}>
                  <strong>{showcase.title}</strong>
                  <span>{showcase.description}</span>
                </span>
                <span className={styles.showcaseArrow} aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.noticeboard} aria-labelledby="noticeboard-title" data-nav-theme="light">
          <div>
            <p className={styles.sectionEyebrow}>This month on campus</p>
            <h2 id="noticeboard-title">Keep up with what’s happening.</h2>
            <p>
              No verified campus events are available to preview yet. The Noticeboard will bring event and achievement updates together.
            </p>
          </div>
          <Link href="/noticeboard" className={styles.noticeboardLink}>
            View noticeboard <span aria-hidden="true">↗</span>
          </Link>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title" data-nav-theme="dark">
          <p className={styles.sectionEyebrow}>Your next idea can start here</p>
          <h2 id="closing-title">Make something that brings people together.</h2>
          <div className={styles.closingActions}>
            <Link href="/auth/sign-in" className={styles.primaryButton}>Sign in <span aria-hidden="true">↗</span></Link>
            <LiveClock />
          </div>
        </section>
        </main>
        <ScrollEffects />
      </div>
    </SmoothScroll>
  );
}

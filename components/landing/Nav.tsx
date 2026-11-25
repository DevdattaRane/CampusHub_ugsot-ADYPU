import Link from 'next/link';
import LogoMark from './LogoMark';
import styles from './welcome.module.css';

const links = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/noticeboard', label: 'Noticeboard' },
];

export default function Nav() {
  return (
    <header className={styles.header} data-landing-nav data-theme="light">
      <div className={styles.headerInner}>
        <Link href="/welcome" className={styles.brand} aria-label="UGSOT Campus Hub">
          <LogoMark />
          <span>UGSOT <span className={styles.brandHub}>CampusHub</span></span>
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              <span className={styles.navRoll}>
                <span>{link.label}</span>
                <span aria-hidden="true">{link.label}</span>
              </span>
            </Link>
          ))}
        </nav>
        <Link href="/auth/sign-in" className={styles.signIn}>Sign in</Link>
      </div>
    </header>
  );
}
